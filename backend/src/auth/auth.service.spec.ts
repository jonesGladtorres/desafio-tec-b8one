import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokensService } from './refresh-tokens.service';

describe('AuthService', () => {
  const user: User = {
    id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
    name: 'Patient Demo',
    email: 'patient@example.com',
    passwordHash: '',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  let refreshTokens: {
    persist: jest.Mock;
    findActive: jest.Mock;
    rotate: jest.Mock;
    revokeOne: jest.Mock;
    revokeAllForUser: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return map[key] ?? fallback;
      }),
      getOrThrow: jest.fn(() => 'refresh-secret'),
    };
    refreshTokens = {
      persist: jest.fn().mockResolvedValue(undefined),
      findActive: jest.fn(),
      rotate: jest.fn().mockResolvedValue(undefined),
      revokeOne: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      refreshTokens as unknown as RefreshTokensService,
    );
  });

  it('returns access + refresh tokens when credentials are valid', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...user,
      passwordHash: await hash('Password123!', 12),
    });

    await expect(
      service.login({
        email: 'patient@example.com',
        password: 'Password123!',
      }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      refreshToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
    expect(refreshTokens.persist).toHaveBeenCalled();
  });

  it('rejects invalid credentials without leaking which field failed', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh token on /auth/refresh', async () => {
    jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
    refreshTokens.findActive.mockResolvedValue({
      id: 'previous-id',
      userId: user.id,
    });
    usersService.findById.mockResolvedValue(user);

    const response = await service.refresh('current-refresh-token');

    expect(response).toMatchObject({
      accessToken: 'signed-token',
      refreshToken: 'signed-token',
      tokenType: 'Bearer',
    });
    expect(refreshTokens.rotate).toHaveBeenCalledWith(
      expect.objectContaining({
        previousId: 'previous-id',
        userId: user.id,
      }),
    );
  });

  it('revokes all tokens when refresh reuse is detected', async () => {
    jwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
    refreshTokens.findActive.mockResolvedValue(null);

    await expect(service.refresh('reused-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith(user.id);
  });
});
