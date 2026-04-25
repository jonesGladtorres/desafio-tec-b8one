import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponse } from './types/login-response';

const TOKEN_EXAMPLE = {
  accessToken: 'jwt-token',
  tokenType: 'Bearer',
  expiresIn: '15m',
  user: {
    id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
    name: 'Patient Demo',
    email: 'patient@example.com',
  },
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
}
