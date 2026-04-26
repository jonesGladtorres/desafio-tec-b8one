import { INestApplication } from '@nestjs/common';
import { Express } from 'express';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { RedisService } from '../src/cache/redis/redis.service';
import { createTestApp, flushRedis, resetDatabase } from './helpers/app';
import type { AuthResponseBody } from './helpers/types';

describe('Auth (e2e)', () => {
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
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  it('registers, logs in, refreshes and logs out', async () => {
    const credentials = {
      name: 'Joana Souza',
      email: 'joana@example.com',
      password: 'Password123!',
    };

    const register = await request(server)
      .post('/auth/register')
      .set('X-API-Version', '1')
      .send(credentials)
      .expect(201);

    const registerBody = register.body as AuthResponseBody;
    expect(registerBody).toMatchObject({
      tokenType: 'Bearer',
      user: { email: 'joana@example.com', name: 'Joana Souza' },
    });
    expect(typeof registerBody.accessToken).toBe('string');
    expect(typeof registerBody.refreshToken).toBe('string');

    const login = await request(server)
      .post('/auth/login')
      .set('X-API-Version', '1')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    const loginBody = login.body as AuthResponseBody;
    const refreshToken = loginBody.refreshToken;

    const refreshed = await request(server)
      .post('/auth/refresh')
      .set('X-API-Version', '1')
      .send({ refreshToken })
      .expect(200);

    const refreshedBody = refreshed.body as AuthResponseBody;
    expect(refreshedBody.refreshToken).not.toBe(refreshToken);

    // Reused token must now be invalid (rotation in effect)
    await request(server)
      .post('/auth/refresh')
      .set('X-API-Version', '1')
      .send({ refreshToken })
      .expect(401);

    await request(server)
      .post('/auth/logout')
      .set('X-API-Version', '1')
      .set('Authorization', `Bearer ${refreshedBody.accessToken}`)
      .send({ refreshToken: refreshedBody.refreshToken })
      .expect(204);
  });

  it('rejects login with wrong password', async () => {
    await request(server)
      .post('/auth/register')
      .set('X-API-Version', '1')
      .send({
        name: 'Joana Souza',
        email: 'joana@example.com',
        password: 'Password123!',
      })
      .expect(201);

    await request(server)
      .post('/auth/login')
      .set('X-API-Version', '1')
      .send({ email: 'joana@example.com', password: 'WrongPassword1' })
      .expect(401);
  });
});
