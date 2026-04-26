import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getStoredUser, getToken, persistSession } from '../auth-storage';
import type { LoginResponse } from '../types';

const mockSession: LoginResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.test.signature',
  refreshToken: 'eyJhbGciOiJIUzI1NiJ9.refresh.signature',
  tokenType: 'Bearer',
  expiresIn: '15m',
  user: { id: 'uuid-123', name: 'Patient Demo', email: 'patient@example.com' },
};

describe('auth-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simula document.cookie para jsdom
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getToken', () => {
    it('retorna null quando não há token armazenado', () => {
      expect(getToken()).toBeNull();
    });

    it('retorna o token após persistSession', () => {
      persistSession(mockSession);
      expect(getToken()).toBe(mockSession.accessToken);
    });
  });

  describe('getStoredUser', () => {
    it('retorna null quando não há usuário armazenado', () => {
      expect(getStoredUser()).toBeNull();
    });

    it('retorna o usuário após persistSession', () => {
      persistSession(mockSession);
      expect(getStoredUser()).toEqual(mockSession.user);
    });

    it('limpa a sessão e retorna null se o JSON for inválido', () => {
      localStorage.setItem('exams_portal_user', '{invalid json}');
      expect(getStoredUser()).toBeNull();
      expect(getToken()).toBeNull();
    });
  });

  describe('persistSession', () => {
    it('armazena token e usuário no localStorage', () => {
      persistSession(mockSession);
      expect(localStorage.getItem('exams_portal_token')).toBe(mockSession.accessToken);
      const stored = JSON.parse(localStorage.getItem('exams_portal_user') ?? '{}');
      expect(stored).toEqual(mockSession.user);
    });
  });

  describe('clearSession', () => {
    it('remove token e usuário do localStorage', () => {
      persistSession(mockSession);
      clearSession();
      expect(getToken()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });
});
