import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma/prisma.service';
import { RedisService } from '../../src/cache/redis/redis.service';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  redis: RedisService;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ bufferLogs: true });
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  return { app, prisma, redis };
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function flushRedis(redis: RedisService): Promise<void> {
  try {
    await redis.getClient().flushdb();
  } catch {
    // ignore — local redis may not be available in some environments
  }
}
