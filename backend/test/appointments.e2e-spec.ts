import { INestApplication } from '@nestjs/common';
import { Express } from 'express';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { RedisService } from '../src/cache/redis/redis.service';
import { createTestApp, flushRedis, resetDatabase } from './helpers/app';
import type {
  AppointmentBody,
  AuthResponseBody,
  PaginatedBody,
} from './helpers/types';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let server: Express;
  let accessToken: string;
  let examId: string;

  const futureSlot = (): string => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 7);
    date.setUTCHours(14, 0, 0, 0);
    return date.toISOString();
  };

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

    const exam = await prisma.exam.create({
      data: {
        name: 'Hemograma completo',
        description: 'Exame e2e',
        durationInMinutes: 15,
        priceCents: 4500,
      },
    });
    examId = exam.id;

    const register = await request(server)
      .post('/auth/register')
      .set('X-API-Version', '1')
      .send({
        name: 'Test User',
        email: 'test.user@example.com',
        password: 'Password123!',
      })
      .expect(201);
    accessToken = (register.body as AuthResponseBody).accessToken;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  it('requires authentication', async () => {
    await request(server)
      .get('/appointments')
      .set('X-API-Version', '1')
      .expect(401);
  });

  it('creates and lists an appointment', async () => {
    const slot = futureSlot();

    const created = await request(server)
      .post('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ examId, scheduledAt: slot })
      .expect(201);

    const createdBody = created.body as AppointmentBody;
    expect(createdBody).toMatchObject({
      scheduledAt: slot,
      status: 'SCHEDULED',
      exam: { id: examId },
    });

    const list = await request(server)
      .get('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listBody = list.body as PaginatedBody<AppointmentBody>;
    expect(listBody.meta.total).toBe(1);
  });

  it('rejects double-booking the same slot for the same exam', async () => {
    const slot = futureSlot();

    await request(server)
      .post('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ examId, scheduledAt: slot })
      .expect(201);

    const otherUser = await request(server)
      .post('/auth/register')
      .set('X-API-Version', '1')
      .send({
        name: 'Other User',
        email: 'other.user@example.com',
        password: 'Password123!',
      })
      .expect(201);

    const otherToken = (otherUser.body as AuthResponseBody).accessToken;

    await request(server)
      .post('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ examId, scheduledAt: slot })
      .expect(409);
  });

  it('rejects slots outside business hours', async () => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 7);
    date.setUTCHours(3, 0, 0, 0);

    await request(server)
      .post('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ examId, scheduledAt: date.toISOString() })
      .expect(400);
  });

  it('cancels and refuses to re-cancel', async () => {
    const slot = futureSlot();

    const created = await request(server)
      .post('/appointments')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ examId, scheduledAt: slot })
      .expect(201);

    const id = (created.body as AppointmentBody).id;

    await request(server)
      .patch(`/appointments/${id}/cancel`)
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(server)
      .patch(`/appointments/${id}/cancel`)
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });
});
