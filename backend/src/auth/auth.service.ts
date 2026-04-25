import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload';
import { LoginResponse } from './types/login-response';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<LoginResponse> {
    const passwordHash = await hash(dto.password, 12);
    const user = await this.usersService.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      passwordHash,
    });
    return this.buildTokenResponse(user);
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

    return this.buildTokenResponse(user);
  }

  private async buildTokenResponse(user: {
    id: string;
    name: string;
    email: string;
  }): Promise<LoginResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
