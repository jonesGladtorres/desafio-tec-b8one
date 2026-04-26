import { INestApplication } from '@nestjs/common';
import { Express } from 'express';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { RedisService } from '../src/cache/redis/redis.service';
import { createTestApp, flushRedis, resetDatabase } from './helpers/app';
import type { ExamSummaryBody, PaginatedBody } from './helpers/types';

describe('Exams (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let server: Express;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    redis = ctx.redis;
    server = app.getHttpAdapter().getInstance() as Express;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await flushRedis(redis);
    await prisma.exam.createMany({
      data: [
        {
          name: 'Hemograma completo',
          description: 'Avalia células sanguíneas.',
          durationInMinutes: 15,
          priceCents: 4500,
        },
        {
          name: 'Glicemia em jejum',
          description: 'Mede glicose sanguínea.',
          durationInMinutes: 10,
          priceCents: 2800,
        },
        {
          name: 'TSH',
          description: 'Avalia tireoide.',
          durationInMinutes: 10,
          priceCents: 4900,
        },
      ],
    });
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  it('lists exams with pagination and filters by name', async () => {
    const all = await request(server)
      .get('/exams')
      .set('X-API-Version', '1')
      .expect(200);

    const allBody = all.body as PaginatedBody<ExamSummaryBody>;
    expect(allBody.meta.total).toBe(3);
    expect(allBody.data).toHaveLength(3);

    const filtered = await request(server)
      .get('/exams?search=hemograma')
      .set('X-API-Version', '1')
      .expect(200);

    const filteredBody = filtered.body as PaginatedBody<ExamSummaryBody>;
    expect(filteredBody.data).toHaveLength(1);
    expect(filteredBody.data[0]?.name).toBe('Hemograma completo');
  });

  it('caches the listing in Redis (second hit reads from cache)', async () => {
    await request(server)
      .get('/exams?page=1&limit=10')
      .set('X-API-Version', '1')
      .expect(200);

    const keys = await redis.getClient().keys('v1:exams:list:*');
    expect(keys.length).toBeGreaterThan(0);

    // Mutating the DB while cache is warm and asserting cached snapshot persists
    await prisma.exam.deleteMany({ where: { name: 'TSH' } });

    const cached = await request(server)
      .get('/exams?page=1&limit=10')
      .set('X-API-Version', '1')
      .expect(200);

    const cachedBody = cached.body as PaginatedBody<ExamSummaryBody>;
    expect(cachedBody.meta.total).toBe(3);
  });

  it('returns 404 for unknown exam id', async () => {
    await request(server)
      .get('/exams/00000000-0000-4000-8000-000000000000')
      .set('X-API-Version', '1')
      .expect(404);
  });
});
