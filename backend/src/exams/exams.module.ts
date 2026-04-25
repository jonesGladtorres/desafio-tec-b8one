import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}
