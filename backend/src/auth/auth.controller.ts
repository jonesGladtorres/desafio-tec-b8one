import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiHeader,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse } from './types/login-response';

@ApiTags('auth')
@ApiHeader({ name: 'X-API-Version', required: true, example: '1' })
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60_000, limit: 5 } })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: {
          id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
          name: 'Patient Demo',
          email: 'patient@example.com',
        },
      },
    },
  })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
