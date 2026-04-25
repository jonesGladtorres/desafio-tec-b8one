import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

export type AppointmentResponse = {
  id: string;
  scheduledAt: string;
  notes: string | null;
  status: AppointmentStatus;
  exam: {
    id: string;
    name: string;
    durationInMinutes: number;
    priceCents: number;
  };
};

export type PaginatedAppointmentsResponse = {
  data: AppointmentResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const scheduledAt = new Date(dto.scheduledAt);

    if (scheduledAt <= new Date()) {
      throw new BadRequestException(
        'Appointment must be scheduled in the future.',
      );
    }

    try {
      const appointment = await this.prisma.$transaction(
        async (transaction) => {
          const exam = await transaction.exam.findFirst({
            where: {
              id: dto.examId,
              isActive: true,
            },
          });

          if (!exam) {
            throw new NotFoundException('Exam not found.');
          }

          const conflictingAppointment =
            await transaction.appointment.findFirst({
              where: {
                scheduledAt,
                status: AppointmentStatus.SCHEDULED,
                OR: [
                  {
                    examId: dto.examId,
                  },
                  {
                    userId,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

          if (conflictingAppointment) {
            throw new ConflictException(
              'Appointment time is no longer available.',
            );
          }

          return transaction.appointment.create({
            data: {
              userId,
              examId: dto.examId,
              scheduledAt,
              notes: dto.notes?.trim() || null,
            },
            include: {
              exam: true,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return this.toResponse(appointment);
    } catch (error) {
      if (
        this.isUniqueConstraintViolation(error) ||
        this.isTransactionConflict(error)
      ) {
        throw new ConflictException('Appointment time is no longer available.');
      }

      throw error;
    }
  }

  async findAllByUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedAppointmentsResponse> {
    const { page, limit } = query;

    const [total, appointments] = await this.prisma.$transaction([
      this.prisma.appointment.count({ where: { userId } }),
      this.prisma.appointment.findMany({
        where: { userId },
        include: { exam: true },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: appointments.map((appointment) => this.toResponse(appointment)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancel(
    userId: string,
    appointmentId: string,
  ): Promise<AppointmentResponse> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId,
      },
      include: {
        exam: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
      return this.toResponse(appointment);
    }

    if (appointment.scheduledAt <= new Date()) {
      throw new BadRequestException('Past appointments cannot be canceled.');
    }

    const canceled = await this.prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
      include: {
        exam: true,
      },
    });

    return this.toResponse(canceled);
  }

  private toResponse(
    appointment: Prisma.AppointmentGetPayload<{ include: { exam: true } }>,
  ): AppointmentResponse {
    return {
      id: appointment.id,
      scheduledAt: appointment.scheduledAt.toISOString(),
      notes: appointment.notes,
      status: appointment.status,
      exam: {
        id: appointment.exam.id,
        name: appointment.exam.name,
        durationInMinutes: appointment.exam.durationInMinutes,
        priceCents: appointment.exam.priceCents,
      },
    };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isTransactionConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    );
  }
}
