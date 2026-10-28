import { describe, expect, it } from 'vitest';
import { formatPreciseDate, historyDateProblem, normalizeToPrecision, showDateProblem, slugify, todayBR } from './dates';

describe('regras de data', () => {
  it('História aceita de 2004 até hoje', () => {
    expect(historyDateProblem('2004-01-01', '2026-10-20')).toBeNull();
    expect(historyDateProblem('2026-10-20', '2026-10-20')).toBeNull();
    expect(historyDateProblem('2003-12-31', '2026-10-20')).toMatch(/2004/);
    expect(historyDateProblem('2026-10-21', '2026-10-20')).toMatch(/já aconteceram/);
  });
  it('Agenda aceita de hoje em diante', () => {
    expect(showDateProblem('2026-10-20', '2026-10-20')).toBeNull();
    expect(showDateProblem('2027-01-01', '2026-10-20')).toBeNull();
    expect(showDateProblem('2026-10-19', '2026-10-20')).toMatch(/História/);
  });
  it('"hoje" segue o horário de Brasília, não o UTC', () => {
    // 23h30 em Brasília de 20/10 = 02h30 UTC de 21/10
    expect(todayBR(new Date('2026-10-21T02:30:00Z'))).toBe('2026-10-20');
  });
});

describe('datas com precisão', () => {
  it('formata e normaliza', () => {
    expect(formatPreciseDate('2006-03-08', 'day')).toBe('08/03/2006');
    expect(formatPreciseDate('2006-03-01', 'month')).toBe('março de 2006');
    expect(formatPreciseDate('2006-01-01', 'year')).toBe('2006');
    expect(normalizeToPrecision('2006-03-08', 'year')).toBe('2006-01-01');
    expect(normalizeToPrecision('2006-03-08', 'month')).toBe('2006-03-01');
  });
  it('gera endereços amigáveis', () => {
    expect(slugify('Espetáculo Sujos — Grupo K - Teatro')).toBe('espetaculo-sujos-grupo-k-teatro');
    expect(slugify('Um é Pouco, Dois é Bom e blá, blá, blá')).toBe('um-e-pouco-dois-e-bom-e-bla-bla-bla');
  });
});
