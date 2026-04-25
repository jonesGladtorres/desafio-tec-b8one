import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { RedisService } from '../cache/redis/redis.service';
import { PrismaService } from '../database/prisma/prisma.service';
import { ListExamsQueryDto } from './dto/list-exams-query.dto';

export type ExamSummaryResponse = {
  id: string;
  name: string;
  durationInMinutes: number;
  priceCents: number;
};

export type ExamDetailsResponse = ExamSummaryResponse & {
  description: string;
  preparationInstructions: string | null;
};

export type AvailableSlotsResponse = {
  date: string;
  slots: {
    startsAt: string;
    available: boolean;
  }[];
};

export type PaginatedExamsResponse = {
  data: ExamSummaryResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class ExamsService {
  private readonly cacheTtlInSeconds = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(query: ListExamsQueryDto): Promise<PaginatedExamsResponse> {
    const page = query.page;
    const limit = query.limit;
    const search = query.search?.trim() || undefined;
    const cacheKey = this.listCacheKey(page, limit, search);
    const cached = await this.redis.getJson<PaginatedExamsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: Prisma.ExamWhereInput = {
      isActive: true,
      ...(search
        ? {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
    };

    const [total, exams] = await this.prisma.$transaction([
      this.prisma.exam.count({ where }),
      this.prisma.exam.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const response: PaginatedExamsResponse = {
      data: exams.map((exam) => ({
        id: exam.id,
        name: exam.name,
        durationInMinutes: exam.durationInMinutes,
        priceCents: exam.priceCents,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.setJson(cacheKey, response, this.cacheTtlInSeconds);

    return response;
  }

  async findOne(id: string): Promise<ExamDetailsResponse> {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    return {
      id: exam.id,
      name: exam.name,
      description: exam.description,
      preparationInstructions: exam.preparationInstructions,
      durationInMinutes: exam.durationInMinutes,
      priceCents: exam.priceCents,
    };
  }

  async findAvailableSlots(
    examId: string,
    date: string,
  ): Promise<AvailableSlotsResponse> {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found.');
    }

    const requestedDate = new Date(`${date}T00:00:00.000Z`);
    const nextDate = new Date(requestedDate);
    nextDate.setUTCDate(requestedDate.getUTCDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        examId,
        scheduledAt: {
          gte: requestedDate,
          lt: nextDate,
        },
        status: AppointmentStatus.SCHEDULED,
      },
      select: {
        scheduledAt: true,
      },
    });

    const occupied = new Set(
      appointments.map((appointment) => appointment.scheduledAt.toISOString()),
    );

    return {
      date,
      slots: this.buildBusinessSlots(requestedDate).map((startsAt) => ({
        startsAt: startsAt.toISOString(),
        available:
          startsAt > new Date() && !occupied.has(startsAt.toISOString()),
      })),
    };
  }

  private listCacheKey(page: number, limit: number, search?: string): string {
    const params = JSON.stringify({ page, limit, search: search ?? '' });
    return `v1:exams:list:${Buffer.from(params).toString('base64url')}`;
  }

  private buildBusinessSlots(date: Date): Date[] {
    const slots: Date[] = [];

    for (let hour = 8; hour <= 17; hour += 1) {
      for (const minute of [0, 30]) {
        const slot = new Date(date);
        slot.setUTCHours(hour, minute, 0, 0);
        slots.push(slot);
      }
    }

    return slots;
  }
}
