import {
  clearSession,
  getRefreshToken,
  getToken,
  updateAccessToken,
} from './auth-storage';
import type {
  Appointment,
  AvailableSlotsResponse,
  ExamDetails,
  ExamSummary,
  LoginResponse,
  PaginatedResponse,
  RefreshResponse,
  UpdateProfileResponse,
  UserProfile,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
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

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          [API_VERSION_HEADER]: '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as RefreshResponse;
      updateAccessToken(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function performRequest(path: string, options: RequestOptions): Promise<Response> {
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

  return fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  let response = await performRequest(path, options);

  if (response.status === 401 && options.authenticated) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await performRequest(path, options);
    }

    if (response.status === 401) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
      throw new ApiError('Sessão expirada. Faça login novamente.', 401);
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? ((await response.json()) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload), response.status);
  }

  return payload as TResponse;
}

function readErrorMessage(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = payload.message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  return 'Não foi possível concluir a solicitação.';
}

export const api = {
  register(data: { name: string; email: string; password: string }): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: data,
    });
  },

  login(email: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  logout(refreshToken: string): Promise<void> {
    return request<void>('/auth/logout', {
      method: 'POST',
      authenticated: true,
      body: { refreshToken },
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

  getAvailableSlots(examId: string, date: string): Promise<AvailableSlotsResponse> {
    return request<AvailableSlotsResponse>(`/exams/${examId}/available-slots?date=${date}`);
  },

  getProfile(): Promise<UserProfile> {
    return request<UserProfile>('/users/me', { authenticated: true });
  },

  updateProfile(data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<UpdateProfileResponse> {
    return request<UpdateProfileResponse>('/users/me', {
      method: 'PATCH',
      authenticated: true,
      body: data,
    });
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
