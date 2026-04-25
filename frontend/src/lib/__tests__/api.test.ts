import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api';

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
  } as Response);
}

describe('ApiError', () => {
  it('herda de Error e expõe status', () => {
    const error = new ApiError('não autorizado', 401);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('não autorizado');
    expect(error.status).toBe(401);
  });
});

describe('api.login', () => {
  afterEach(() => vi.restoreAllMocks());

  it('chama POST /auth/login e retorna a sessão', async () => {
    const session = { accessToken: 'tok', tokenType: 'Bearer', expiresIn: '15m', user: {} };
    mockFetch(200, session);

    const result = await api.login('user@test.com', 'pass');
    expect(result).toEqual(session);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lança ApiError quando credenciais são inválidas', async () => {
    mockFetch(401, { message: 'Unauthorized' });

    await expect(api.login('wrong@test.com', 'wrong')).rejects.toThrow(ApiError);
  });
});

describe('api.listExams', () => {
  afterEach(() => vi.restoreAllMocks());

  it('chama GET /exams com parâmetros de paginação', async () => {
    const payload = { data: [], meta: { page: 1, limit: 9, total: 0, totalPages: 0 } };
    mockFetch(200, payload);

    await api.listExams({ page: 1, limit: 9 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/exams?page=1&limit=9'),
      expect.any(Object),
    );
  });

  it('inclui parâmetro search quando fornecido', async () => {
    const payload = { data: [], meta: { page: 1, limit: 9, total: 0, totalPages: 0 } };
    mockFetch(200, payload);

    await api.listExams({ page: 1, limit: 9, search: 'hemograma' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=hemograma'),
      expect.any(Object),
    );
  });
});
