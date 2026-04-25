import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { ListExamsQueryDto } from './dto/list-exams-query.dto';
import {
  AvailableSlotsResponse,
  ExamDetailsResponse,
  ExamsService,
  PaginatedExamsResponse,
} from './exams.service';

@ApiTags('exams')
@ApiHeader({ name: 'X-API-Version', required: true, example: '1' })
@Controller({ path: 'exams', version: '1' })
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
            name: 'Hemograma completo',
            durationInMinutes: 15,
            priceCents: 4500,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  findAll(@Query() query: ListExamsQueryDto): Promise<PaginatedExamsResponse> {
    return this.examsService.findAll(query);
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: 'Exam not found or inactive.' })
  @ApiOkResponse({
    schema: {
      example: {
        id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
        name: 'Hemograma completo',
        description:
          'Avalia celulas sanguineas e auxilia no diagnostico geral.',
        preparationInstructions: 'Jejum nao obrigatorio.',
        durationInMinutes: 15,
        priceCents: 4500,
      },
    },
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ExamDetailsResponse> {
    return this.examsService.findOne(id);
  }

  @Get(':id/available-slots')
  @ApiNotFoundResponse({ description: 'Exam not found or inactive.' })
  @ApiOkResponse({
    schema: {
      example: {
        date: '2026-05-12',
        slots: [
          {
            startsAt: '2026-05-12T08:00:00.000Z',
            available: true,
          },
        ],
      },
    },
  })
  findAvailableSlots(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: AvailableSlotsQueryDto,
  ): Promise<AvailableSlotsResponse> {
    return this.examsService.findAvailableSlots(id, query.date);
  }
}
