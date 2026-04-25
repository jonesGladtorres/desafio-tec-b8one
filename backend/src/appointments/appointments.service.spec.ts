import { ConflictException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { AppointmentsService } from './appointments.service';

type TransactionMock = {
  exam: {
    findFirst: jest.Mock;
  };
  appointment: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe('AppointmentsService', () => {
  let transaction: TransactionMock;
  let prisma: { $transaction: jest.Mock };
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
          scheduledAt: new Date('2026-05-12T14:00:00.000Z'),
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
    };
    service = new AppointmentsService(prisma as unknown as PrismaService);
  });

  it('creates an appointment when the exam exists and the slot is free', async () => {
    await expect(
      service.create('0fe10bb7-fab2-49af-bda4-c5a1ca838d02', {
        examId: 'b2659b7e-cc77-4e03-a6f9-5fb32d9b533a',
        scheduledAt: '2026-05-12T14:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
      scheduledAt: '2026-05-12T14:00:00.000Z',
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
        scheduledAt: '2026-05-12T14:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
