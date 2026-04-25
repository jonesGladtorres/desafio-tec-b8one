export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: User;
};

export type ExamSummary = {
  id: string;
  name: string;
  durationInMinutes: number;
  priceCents: number;
};

export type ExamDetails = ExamSummary & {
  description: string;
  preparationInstructions: string | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<TData> = {
  data: TData[];
  meta: PaginationMeta;
};

export type Slot = {
  startsAt: string;
  available: boolean;
};

export type AvailableSlotsResponse = {
  date: string;
  slots: Slot[];
};

export type AppointmentStatus = 'SCHEDULED' | 'CANCELED';

export type Appointment = {
  id: string;
  scheduledAt: string;
  notes: string | null;
  status: AppointmentStatus;
  exam: ExamSummary;
};

export type UserProfile = User & {
  memberSince: string;
  stats: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
  };
  nextAppointment: {
    id: string;
    scheduledAt: string;
    exam: {
      id: string;
      name: string;
    };
  } | null;
};
