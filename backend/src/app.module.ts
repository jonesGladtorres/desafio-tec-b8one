import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { ExamsModule } from './exams/exams.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const pinoHttp: Record<string, unknown> = {
          level: isProd ? 'info' : 'debug',
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.currentPassword',
              'req.body.newPassword',
              'req.body.refreshToken',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
          customProps: () => ({ context: 'HTTP' }),
          autoLogging: {
            ignore: (req: { url?: string }) => req.url === '/health',
          },
          serializers: {
            req: (req: { id?: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
          },
        };

        if (!isProd) {
          pinoHttp.transport = {
            target: 'pino-pretty',
            options: { singleLine: true, colorize: true },
          };
        }

        return { pinoHttp };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: 60_000,
            limit: 60,
          },
        ],
        storage: new ThrottlerStorageRedisService(
          configService.getOrThrow<string>('REDIS_URL'),
        ),
      }),
    }),
    DatabaseModule,
    CacheModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ExamsModule,
    AppointmentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
