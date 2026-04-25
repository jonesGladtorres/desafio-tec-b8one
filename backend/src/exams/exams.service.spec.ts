import { RedisService } from '../cache/redis/redis.service';
import { PrismaService } from '../database/prisma/prisma.service';
import { ExamsService, PaginatedExamsResponse } from './exams.service';

describe('ExamsService', () => {
  let prisma: {
    $transaction: jest.Mock;
    exam: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let redis: { getJson: jest.Mock; setJson: jest.Mock };
  let service: ExamsService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries)),
      exam: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    redis = {
      getJson: jest.fn(),
      setJson: jest.fn().mockResolvedValue(undefined),
    };
    service = new ExamsService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
  });

  it('returns cached exam lists without hitting the database', async () => {
    const cached: PaginatedExamsResponse = {
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
    };
    redis.getJson.mockResolvedValue(cached);

    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toBe(cached);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('stores the database result in Redis when the cache misses', async () => {
    redis.getJson.mockResolvedValue(null);
    prisma.exam.count.mockResolvedValue(1);
    prisma.exam.findMany.mockResolvedValue([
      {
        id: '8b931f23-b309-41ce-bcbf-8f321d92d077',
        name: 'Hemograma completo',
        description: 'Descricao',
        preparationInstructions: null,
        durationInMinutes: 15,
        priceCents: 4500,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const response = await service.findAll({
      page: 1,
      limit: 10,
      search: 'hemo',
    });

    expect(response.meta.total).toBe(1);
    expect(response.data).toHaveLength(1);
    expect(redis.setJson).toHaveBeenCalledWith(
      expect.stringContaining('v1:exams:list:'),
      response,
      300,
    );
  });
});
