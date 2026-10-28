const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export interface DateParts { day: string; month: string; year: string }

/** Divide "2025-06-13" em partes sem passar por fuso horário (evita voltar um dia). */
export function dateParts(iso: string): DateParts {
  const [year = '', month = '', day = ''] = iso.split('-');
  const idx = Number(month) - 1;
  return { day: day || '--', month: MONTHS[idx] ?? '---', year };
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function monthYearLabel(iso: string): string {
  const { month, year } = dateParts(iso);
  return `${month.charAt(0)}${month.slice(1).toLowerCase()} ${year}`;
}

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Próximos primeiro (mais perto de hoje), depois os já realizados (mais recentes primeiro). */
export function sortShows<T extends { date: string }>(shows: T[], today: string = todayISO()): T[] {
  const upcoming = shows.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = shows.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return [...upcoming, ...past];
}

export function accentColor(index: number): string {
  return `var(--accent-cycle-${(index % 4) + 1})`;
}
