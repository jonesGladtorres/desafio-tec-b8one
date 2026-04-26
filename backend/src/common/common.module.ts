import { Global, Module } from '@nestjs/common';
import { BusinessHoursConfig } from './business-hours';

@Global()
@Module({
  providers: [BusinessHoursConfig],
  exports: [BusinessHoursConfig],
})
export class CommonModule {}
