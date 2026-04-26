import type { LoginResponse, User } from './types';

const TOKEN_KEY = 'exams_portal_token';
const REFRESH_KEY = 'exams_portal_refresh';
const USER_KEY = 'exams_portal_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
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

export function getStoredUserRaw(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_KEY);
}

function buildCookie(value: string, maxAgeSeconds: number): string {
  // Secure só funciona em HTTPS — adiciona quando rodar em produção (Next injeta NODE_ENV no client).
  const isSecure = process.env.NODE_ENV === 'production';
  const parts = [
    `${TOKEN_KEY}=${value}`,
    'path=/',
    `max-age=${maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

export function persistSession(session: LoginResponse): void {
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_KEY, session.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  // Cookie usado pelo middleware para proteger rotas server-side sem flash
  document.cookie = buildCookie(session.accessToken, 60 * 60 * 24);
}

export function updateAccessToken(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
  document.cookie = buildCookie(accessToken, 60 * 60 * 24);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = buildCookie('', 0);
}
