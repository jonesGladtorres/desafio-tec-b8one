import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  AppointmentResponse,
  AppointmentsService,
  PaginatedAppointmentsResponse,
} from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@ApiHeader({ name: 'X-API-Version', required: true, example: '1' })
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@UseGuards(JwtAuthGuard)
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiCreatedResponse({
    schema: {
      example: {
        id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
        scheduledAt: '2026-05-12T14:00:00.000Z',
        notes: null,
        status: 'SCHEDULED',
        exam: {
          id: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
          name: 'Hemograma completo',
          durationInMinutes: 15,
          priceCents: 4500,
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Time slot already taken for this exam or user.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
            scheduledAt: '2026-05-12T14:00:00.000Z',
            notes: null,
            status: 'SCHEDULED',
            exam: {
              id: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
              name: 'Hemograma completo',
              durationInMinutes: 15,
              priceCents: 4500,
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedAppointmentsResponse> {
    return this.appointmentsService.findAllByUser(user.id, query);
  }

  @Patch(':id/cancel')
  @ApiOkResponse({
    schema: {
      example: {
        id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
        scheduledAt: '2026-05-12T14:00:00.000Z',
        notes: null,
        status: 'CANCELED',
        exam: {
          id: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
          name: 'Hemograma completo',
          durationInMinutes: 15,
          priceCents: 4500,
        },
      },
    },
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.cancel(user.id, id);
  }
}
