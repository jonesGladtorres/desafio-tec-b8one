import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensService } from './refresh-tokens.service';
import { JwtPayload } from './types/jwt-payload';
import { LoginResponse, RefreshResponse } from './types/login-response';

type SafeUser = { id: string; name: string; email: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokens: RefreshTokensService,
  ) {}

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      passwordHash,
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const payload = this.verifyRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findActive(refreshToken);

    if (!stored || stored.userId !== payload.sub) {
      // Detected reuse or unknown token: revoke everything for the user.
      if (payload.sub) {
        await this.refreshTokens.revokeAllForUser(payload.sub);
      }
      throw new UnauthorizedException('Refresh token invalid.');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    const next = await this.signRefreshToken(user.id, user.email);
    await this.refreshTokens.rotate({
      previousId: stored.id,
      userId: user.id,
      nextToken: next.token,
      expiresAt: next.expiresAt,
    });

    return {
      accessToken: await this.signAccessToken(user.id, user.email),
      refreshToken: next.token,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry(),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revokeOne(refreshToken);
  }

  private async issueTokens(user: SafeUser): Promise<LoginResponse> {
    const accessToken = await this.signAccessToken(user.id, user.email);
    const refresh = await this.signRefreshToken(user.id, user.email);

    await this.refreshTokens.persist({
      userId: user.id,
      token: refresh.token,
      expiresAt: refresh.expiresAt,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry(),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  private signAccessToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }

  private async signRefreshToken(
    userId: string,
    email: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const expiresIn = this.refreshTokenExpiry();
    const payload: JwtPayload & { jti: string } = {
      sub: userId,
      email,
      jti: randomUUID(),
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // ms-style string (e.g. "7d") accepted by jsonwebtoken at runtime
      expiresIn: expiresIn as unknown as number,
    });

    return {
      token,
      expiresAt: new Date(Date.now() + this.parseDurationMs(expiresIn)),
    };
  }

  private verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalid.');
    }
  }

  private accessTokenExpiry(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  private refreshTokenExpiry(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  private parseDurationMs(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
      const asNumber = Number(value);
      if (Number.isFinite(asNumber)) return asNumber * 1000;
      return 7 * 24 * 60 * 60 * 1000;
    }
    const amount = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * (multipliers[unit] ?? 1000);
  }
}
