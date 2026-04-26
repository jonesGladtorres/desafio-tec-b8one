import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponse, RefreshResponse } from './types/login-response';

const TOKEN_EXAMPLE = {
  accessToken: 'eyJhbGciOi...access',
  refreshToken: 'eyJhbGciOi...refresh',
  tokenType: 'Bearer',
  expiresIn: '15m',
  user: {
    id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
    name: 'Patient Demo',
    email: 'patient@example.com',
  },
};

const REFRESH_EXAMPLE = {
  accessToken: 'eyJhbGciOi...access',
  refreshToken: 'eyJhbGciOi...refresh',
  tokenType: 'Bearer',
  expiresIn: '15m',
};

@ApiTags('auth')
@ApiHeader({ name: 'X-API-Version', required: true, example: '1' })
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiCreatedResponse({ schema: { example: TOKEN_EXAMPLE } })
  @ApiConflictResponse({ description: 'Email already in use.' })
  register(@Body() dto: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiOkResponse({ schema: { example: TOKEN_EXAMPLE } })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60_000, limit: 30 } })
  @ApiOkResponse({ schema: { example: REFRESH_EXAMPLE } })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid or expired.' })
  refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiNoContentResponse({ description: 'Refresh token revoked.' })
  async logout(
    @CurrentUser() _user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}
