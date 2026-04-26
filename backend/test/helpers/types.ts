export type AuthResponseBody = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: { id: string; name: string; email: string };
};

export type ExamSummaryBody = {
  id: string;
  name: string;
  durationInMinutes: number;
  priceCents: number;
};

export type PaginatedBody<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type AppointmentBody = {
  id: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'CANCELED';
  notes: string | null;
  exam: ExamSummaryBody;
};
