import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, User } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';

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
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
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
