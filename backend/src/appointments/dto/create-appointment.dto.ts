import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: '8b931f23-b309-41ce-bcbf-8f321d92d077' })
  @IsUUID('4')
  examId!: string;

  @ApiProperty({ example: '2026-05-12T14:00:00.000Z' })
  @IsISO8601({ strict: true })
  scheduledAt!: string;

  @ApiPropertyOptional({
    example: 'Paciente prefere atendimento no periodo da tarde.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
