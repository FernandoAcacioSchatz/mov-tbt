import { useWatch, type Control, type FieldValues, type UseFormSetValue } from 'react-hook-form';
import type { DatePrecision } from '../utils/dates';
import { HISTORY_MIN_DATE, todayBR } from '../utils/dates';

/**
 * Data do acontecimento com precisão: dia exato, só mês ou só ano.
 * Grava sempre em "event_date" (AAAA-MM-DD) e "date_precision".
 */
export function HistoryDateField({ idPrefix, control, setValue, error }: {
  idPrefix: string;
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  error?: string;
}) {
  const precision = (useWatch({ control, name: 'date_precision' }) ?? 'day') as DatePrecision;
  const date = String(useWatch({ control, name: 'event_date' }) ?? '');
  const today = todayBR();
  const [y = '', m = '', d = ''] = date.split('-');
  const set = (v: string) => setValue('event_date', v, { shouldValidate: true, shouldDirty: true });

  const changePrecision = (p: DatePrecision) => {
    setValue('date_precision', p, { shouldDirty: true });
    if (!y) return;
    if (p === 'year') set(`${y}-01-01`);
    else if (p === 'month') set(`${y}-${m || '01'}-01`);
    else set(`${y}-${m || '01'}-${d || '01'}`);
  };

  return (
    <fieldset className="field datefield">
      <legend className="label">Data do acontecimento</legend>
      <div className="datefield__row">
        <select id={`${idPrefix}-precision`} className="input datefield__precision" aria-label="Precisão da data" value={precision} onChange={(e) => changePrecision(e.target.value as DatePrecision)}>
          <option value="day">Dia exato</option>
          <option value="month">Só mês e ano</option>
          <option value="year">Só o ano</option>
        </select>
        {precision === 'day' && (
          <input id={`${idPrefix}-date`} className="input" type="date" aria-label="Data" min={HISTORY_MIN_DATE} max={today} value={date} aria-invalid={!!error} onChange={(e) => set(e.target.value)} />
        )}
        {precision === 'month' && (
          <input id={`${idPrefix}-date`} className="input" type="month" aria-label="Mês e ano" min={HISTORY_MIN_DATE.slice(0, 7)} max={today.slice(0, 7)} value={y && m ? `${y}-${m}` : ''} aria-invalid={!!error} onChange={(e) => set(e.target.value ? `${e.target.value}-01` : '')} />
        )}
        {precision === 'year' && (
          <input id={`${idPrefix}-date`} className="input" type="number" inputMode="numeric" aria-label="Ano" min={2004} max={Number(today.slice(0, 4))} value={y} aria-invalid={!!error} onChange={(e) => set(/^\d{4}$/.test(e.target.value) ? `${e.target.value}-01-01` : '')} />
        )}
      </div>
      <span className="field__hint">De 2004 até hoje. A ordem na História segue esta data.</span>
      {error && <span className="field__error" role="alert">{error}</span>}
    </fieldset>
  );
}
