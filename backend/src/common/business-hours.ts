import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SLOT_INTERVAL_MINUTES = 30;

@Injectable()
export class BusinessHoursConfig {
  readonly startHour: number;
  readonly endHour: number;
  readonly offsetMinutes: number;

  constructor(configService: ConfigService) {
    this.startHour = configService.get<number>('BUSINESS_START_HOUR', 8);
    this.endHour = configService.get<number>('BUSINESS_END_HOUR', 17);
    // Offset positivo = leste de UTC. Brasil (BRT) = -180.
    this.offsetMinutes = configService.get<number>(
      'BUSINESS_TIMEZONE_OFFSET_MINUTES',
      0,
    );
  }

  toLocal(date: Date): {
    hour: number;
    minute: number;
    seconds: number;
    ms: number;
  } {
    const shifted = new Date(date.getTime() + this.offsetMinutes * 60_000);
    return {
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes(),
      seconds: shifted.getUTCSeconds(),
      ms: shifted.getUTCMilliseconds(),
    };
  }

  isWithinBusinessHours(date: Date): boolean {
    const { hour, minute, seconds, ms } = this.toLocal(date);
    const isOnSlotBoundary =
      seconds === 0 && ms === 0 && minute % SLOT_INTERVAL_MINUTES === 0;
    const isInRange =
      hour >= this.startHour &&
      (hour < this.endHour || (hour === this.endHour && minute === 30));
    return isOnSlotBoundary && isInRange;
  }

  describe(): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${pad(this.startHour)}:00 and ${pad(this.endHour)}:30 (offset ${this.offsetMinutes >= 0 ? '+' : ''}${this.offsetMinutes}m)`;
  }

  buildSlots(localDate: Date): Date[] {
    const slots: Date[] = [];
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth();
    const day = localDate.getUTCDate();

    for (let hour = this.startHour; hour <= this.endHour; hour += 1) {
      for (const minute of [0, 30]) {
        const localMs = Date.UTC(year, month, day, hour, minute);
        slots.push(new Date(localMs - this.offsetMinutes * 60_000));
      }
    }

    return slots;
  }
}
