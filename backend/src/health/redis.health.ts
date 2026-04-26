import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../cache/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const reply = await this.redis.getClient().ping();
      const isHealthy = reply === 'PONG';

      const result = this.getStatus(key, isHealthy, { reply });
      if (!isHealthy) {
        throw new HealthCheckError('Redis ping failed', result);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message }),
      );
    }
  }
}
