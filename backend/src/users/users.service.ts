import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppointmentStatus, User } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  stats: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
  };
  nextAppointment: {
    id: string;
    scheduledAt: string;
    exam: {
      id: string;
      name: string;
    };
  } | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already in use.');
    }
    return this.prisma.user.create({ data });
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<{ id: string; name: string; email: string }> {
    if (dto.currentPassword !== undefined && dto.newPassword === undefined) {
      throw new BadRequestException('newPassword is required when currentPassword is provided.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updateData: Partial<{ name: string; email: string; passwordHash: string }> = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.email !== undefined) {
      const lowerEmail = dto.email.toLowerCase();
      if (lowerEmail !== user.email) {
        const taken = await this.findByEmail(lowerEmail);
        if (taken) {
          throw new ConflictException('Email already in use.');
        }
        updateData.email = lowerEmail;
      }
    }

    if (dto.currentPassword !== undefined && dto.newPassword !== undefined) {
      const passwordMatches = await compare(dto.currentPassword, user.passwordHash);
      if (!passwordMatches) {
        throw new UnauthorizedException('Current password is incorrect.');
      }
      updateData.passwordHash = await hash(dto.newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return { id: user.id, name: user.name, email: user.email };
    }

    const updated = await this.prisma.user.update({ where: { id }, data: updateData });
    return { id: updated.id, name: updated.name, email: updated.email };
  }

  async getProfile(id: string): Promise<UserProfileResponse> {
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        appointments: {
          include: {
            exam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const scheduledAppointments = user.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.SCHEDULED,
    );
    const upcomingAppointments = scheduledAppointments.filter(
      (appointment) => appointment.scheduledAt >= now,
    );
    const completedAppointments = scheduledAppointments.filter(
      (appointment) => appointment.scheduledAt < now,
    );
    const nextAppointment = upcomingAppointments.at(0);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      memberSince: user.createdAt.toISOString(),
      stats: {
        totalAppointments: user.appointments.length,
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments: completedAppointments.length,
      },
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            scheduledAt: nextAppointment.scheduledAt.toISOString(),
            exam: nextAppointment.exam,
          }
        : null,
    };
  }
}
