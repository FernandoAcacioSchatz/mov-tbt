/** Primeiro dia aceito na História. */
export const HISTORY_MIN_DATE = '2004-01-01';

/** "Hoje" no horário de Brasília (AAAA-MM-DD), igual à regra do banco. */
export function todayBR(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export const HISTORY_DATE_ERROR_MIN = 'A História começa em 2004. Confira a data.';
export const HISTORY_DATE_ERROR_MAX = 'A História só aceita fatos que já aconteceram (data até hoje).';
export const SHOW_DATE_ERROR = 'A Agenda só aceita apresentações de hoje em diante. Para registrar algo que já aconteceu, use a História.';

/** Regra da História: de 01/01/2004 até hoje. Devolve a mensagem de erro ou null. */
export function historyDateProblem(iso: string, today: string = todayBR()): string | null {
  if (iso < HISTORY_MIN_DATE) return HISTORY_DATE_ERROR_MIN;
  if (iso > today) return HISTORY_DATE_ERROR_MAX;
  return null;
}

/** Regra da Agenda: apresentação nova (ou com a data alterada) não pode ser antes de hoje. */
export function showDateProblem(iso: string, today: string = todayBR()): string | null {
  return iso < today ? SHOW_DATE_ERROR : null;
}

export type DatePrecision = 'day' | 'month' | 'year';

const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Data legível conforme a precisão: "08/03/2006", "março de 2006" ou "2006". */
export function formatPreciseDate(iso: string, precision: DatePrecision): string {
  const [y = '', m = '', d = ''] = iso.split('-');
  if (precision === 'year') return y;
  if (precision === 'month') return `${MONTHS_LONG[Number(m) - 1] ?? m} de ${y}`;
  return `${d}/${m}/${y}`;
}

/** Normaliza a data para a precisão (ano → 1º de janeiro; mês → dia 1), como o banco faz. */
export function normalizeToPrecision(iso: string, precision: DatePrecision): string {
  const [y = '', m = '01'] = iso.split('-');
  if (precision === 'year') return `${y}-01-01`;
  if (precision === 'month') return `${y}-${m}-01`;
  return iso;
}

/** Transforma um título em endereço amigável: "Sujos — Grupo K" → "sujos-grupo-k". */
export function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}
