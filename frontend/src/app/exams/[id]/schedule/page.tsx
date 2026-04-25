import type { Metadata } from 'next';
import { ExamScheduleClient } from '../client';

export const metadata: Metadata = {
  title: 'Agendar exame',
  description: 'Escolha data e horário disponíveis para agendar seu exame.',
};

export default function ExamSchedulePage() {
  return <ExamScheduleClient />;
}
