import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatus } from '@prisma/client';
import { BusinessHoursConfig } from '../common/business-hours';
import { PrismaService } from '../database/prisma/prisma.service';
import { AppointmentsService } from './appointments.service';

type TransactionMock = {
  exam: { findFirst: jest.Mock };
  appointment: { findFirst: jest.Mock; create: jest.Mock };
};

const VALID_FUTURE_SLOT = '2099-05-12T14:00:00.000Z';

describe('AppointmentsService', () => {
  let transaction: TransactionMock;
  let prisma: {
    $transaction: jest.Mock;
    appointment: { findFirst: jest.Mock; update: jest.Mock };
  };
  let service: AppointmentsService;

  beforeEach(() => {
    transaction = {
      exam: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
          name: 'Hemograma completo',
          durationInMinutes: 15,
          priceCents: 4500,
          isActive: true,
        }),
      },
      appointment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
          userId: '0fe10bb7-fab2-49af-bda4-c5a1ca838d02',
          examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
          scheduledAt: new Date(VALID_FUTURE_SLOT),
          notes: null,
          status: AppointmentStatus.SCHEDULED,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          exam: {
            id: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
            name: 'Hemograma completo',
            durationInMinutes: 15,
            priceCents: 4500,
          },
        }),
      },
    };
    prisma = {
      $transaction: jest.fn(
        (callback: (tx: TransactionMock) => Promise<unknown>) =>
          callback(transaction),
      ),
      appointment: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const businessHours = new BusinessHoursConfig(new ConfigService({}));
    service = new AppointmentsService(
      prisma as unknown as PrismaService,
      businessHours,
    );
  });

  it('creates an appointment when the exam exists and the slot is free', async () => {
    await expect(
      service.create('0fe10bb7-fab2-49af-bda4-c5a1ca838d02', {
        examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
        scheduledAt: VALID_FUTURE_SLOT,
      }),
    ).resolves.toMatchObject({
      id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
      scheduledAt: VALID_FUTURE_SLOT,
      status: AppointmentStatus.SCHEDULED,
    });
  });

  it('rejects occupied slots', async () => {
    transaction.appointment.findFirst.mockResolvedValue({
      id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
    });

    await expect(
      service.create('0fe10bb7-fab2-49af-bda4-c5a1ca838d02', {
        examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
        scheduledAt: VALID_FUTURE_SLOT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects appointments outside business hours (UTC)', async () => {
    await expect(
      service.create('0fe10bb7-fab2-49af-bda4-c5a1ca838d02', {
        examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
        scheduledAt: '2099-05-12T03:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects slots that fall off the 30-minute boundary', async () => {
    await expect(
      service.create('0fe10bb7-fab2-49af-bda4-c5a1ca838d02', {
        examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
        scheduledAt: '2099-05-12T14:17:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cancellation of an appointment that is already canceled', async () => {
    prisma.appointment.findFirst.mockResolvedValue({
      id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
      userId: 'user-id',
      scheduledAt: new Date(VALID_FUTURE_SLOT),
      status: AppointmentStatus.CANCELED,
      exam: {
        id: 'exam-id',
        name: 'Hemograma',
        durationInMinutes: 15,
        priceCents: 4500,
      },
    });

    await expect(
      service.cancel('user-id', '8b931f23-b309-41ce-bcbf-8f321d92d077'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
