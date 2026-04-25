import type { LoginResponse, User } from './types';

const TOKEN_KEY = 'exams_portal_token';
const USER_KEY = 'exams_portal_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    clearSession();
    return null;
  }
}

export function persistSession(session: LoginResponse): void {
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  // Cookie usado pelo middleware para proteger rotas server-side sem flash
  document.cookie = `${TOKEN_KEY}=${session.accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}
