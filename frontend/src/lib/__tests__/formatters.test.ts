import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatDateTime, toDateInputValue } from '../formatters';

describe('formatCurrency', () => {
  it('converte centavos para reais formatados', () => {
    expect(formatCurrency(4500)).toBe('R$ 45,00');
  });

  it('formata valores zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('formata valores com centavos ímpares', () => {
    expect(formatCurrency(99)).toBe('R$ 0,99');
  });

  it('formata valores grandes', () => {
    expect(formatCurrency(100000)).toBe('R$ 1.000,00');
  });
});

describe('formatDateTime', () => {
  it('formata data e hora em português', () => {
    const result = formatDateTime('2026-05-12T11:00:00.000Z');
    expect(result).toContain('12');
    expect(result).toContain('maio');
    expect(result).toContain('11:00');
  });
});

describe('formatDate', () => {
  it('formata data por extenso em português', () => {
    const result = formatDate('2026-04-25T00:00:00.000Z');
    expect(result).toContain('25');
    expect(result).toContain('abril');
    expect(result).toContain('2026');
  });
});

describe('toDateInputValue', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    const date = new Date('2026-06-15T12:00:00.000Z');
    expect(toDateInputValue(date)).toBe('2026-06-15');
  });
});
