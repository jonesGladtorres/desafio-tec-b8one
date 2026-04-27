import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis unavailable: ${error.message}`);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async getJson<TValue>(key: string): Promise<TValue | null> {
    try {
      const cached = await this.client.get(key);
      return cached ? (JSON.parse(cached) as TValue) : null;
    } catch (error) {
      this.logger.warn(
        `Failed to read cache key "${key}": ${this.messageOf(error)}`,
      );
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlInSeconds: number,
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    } catch (error) {
      this.logger.warn(
        `Failed to write cache key "${key}": ${this.messageOf(error)}`,
      );
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    // SCAN evita bloquear o Redis em chaveiros grandes — diferente de KEYS, percorre em lotes.
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const pipeline = this.client.pipeline();
      let queued = 0;

      for await (const batch of stream) {
        const keys = batch as string[];
        if (keys.length === 0) continue;
        pipeline.del(...keys);
        queued += keys.length;
      }

      if (queued > 0) {
        await pipeline.exec();
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete cache pattern "${pattern}": ${this.messageOf(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private messageOf(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown Redis error';
  }
}
