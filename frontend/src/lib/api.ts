import { getToken } from './auth-storage';
import type {
  Appointment,
  AvailableSlotsResponse,
  ExamDetails,
  ExamSummary,
  LoginResponse,
  PaginatedResponse,
  UserProfile,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const API_VERSION_HEADER = 'X-API-Version';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  authenticated?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers({
    [API_VERSION_HEADER]: '1',
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authenticated) {
    const token = getToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const payload = isJson ? ((await response.json()) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload), response.status);
  }

  return payload as TResponse;
}

function readErrorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload
  ) {
    const message = payload.message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }

  return 'Nao foi possivel concluir a solicitacao.';
}

export const api = {
  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  listExams(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResponse<ExamSummary>> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    if (params.search) {
      query.set('search', params.search);
    }

    return request<PaginatedResponse<ExamSummary>>(`/exams?${query}`);
  },

  getExam(id: string): Promise<ExamDetails> {
    return request<ExamDetails>(`/exams/${id}`);
  },

  getAvailableSlots(
    examId: string,
    date: string,
  ): Promise<AvailableSlotsResponse> {
    return request<AvailableSlotsResponse>(
      `/exams/${examId}/available-slots?date=${date}`,
    );
  },

  getProfile(): Promise<UserProfile> {
    return request<UserProfile>('/users/me', { authenticated: true });
  },

  listAppointments(params: {
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<Appointment>> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    return request<PaginatedResponse<Appointment>>(`/appointments?${query}`, {
      authenticated: true,
    });
  },

  createAppointment(input: {
    examId: string;
    scheduledAt: string;
    notes?: string;
  }): Promise<Appointment> {
    return request<Appointment>('/appointments', {
      method: 'POST',
      authenticated: true,
      body: input,
    });
  },

  cancelAppointment(id: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      authenticated: true,
    });
  },
};
