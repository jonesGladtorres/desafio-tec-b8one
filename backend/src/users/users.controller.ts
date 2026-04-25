import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { UserProfileResponse, UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiHeader({ name: 'X-API-Version', required: true, example: '1' })
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({
    schema: {
      example: {
        id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
        name: 'Patient Demo',
        email: 'patient@example.com',
        memberSince: '2026-01-01T00:00:00.000Z',
        stats: {
          totalAppointments: 4,
          upcomingAppointments: 1,
          completedAppointments: 3,
        },
        nextAppointment: null,
      },
    },
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponse> {
    return this.usersService.getProfile(user.id);
  }
}
