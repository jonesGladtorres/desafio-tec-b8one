import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user: User = {
    id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
    name: 'Patient Demo',
    email: 'patient@example.com',
    passwordHash: '',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let usersService: { findByEmail: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    configService = {
      get: jest.fn().mockReturnValue('15m'),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('returns a JWT and public user payload when credentials are valid', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...user,
      passwordHash: await hash('Password123!', 12),
    });

    await expect(
      service.login({
        email: 'patient@example.com',
        password: 'Password123!',
      }),
    ).resolves.toStrictEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
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
});
