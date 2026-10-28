import { describe, expect, it } from 'vitest';
import { accentColor, dateParts, formatDateBR, monthYearLabel, sortShows, todayISO } from './format';

describe('format', () => {
  it('divide a data sem mudar de dia por fuso', () => {
    expect(dateParts('2025-06-13')).toEqual({ day: '13', month: 'JUN', year: '2025' });
  });
  it('formata em pt-BR', () => {
    expect(formatDateBR('2025-06-13')).toBe('13/06/2025');
    expect(monthYearLabel('2025-06-13')).toBe('Jun 2025');
  });
  it('todayISO usa a data local', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('ordena próximos primeiro e depois os realizados', () => {
    const r = sortShows([{ date: '2025-01-01' }, { date: '2026-12-01' }, { date: '2026-03-01' }, { date: '2024-01-01' }], '2026-01-01');
    expect(r.map((s) => s.date)).toEqual(['2026-03-01', '2026-12-01', '2025-01-01', '2024-01-01']);
  });
  it('cicla as cores de destaque', () => {
    expect(accentColor(0)).toBe(accentColor(4));
    expect(accentColor(0)).not.toBe(accentColor(1));
  });
});
