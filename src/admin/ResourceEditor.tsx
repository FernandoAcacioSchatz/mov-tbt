import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useContent } from '../hooks/useContent';
import { createItem, deleteItem, swapPositions, updateItem } from '../services/contentService';
import { formatDateBR, todayISO } from '../utils/format';
import { ImageField } from './ImageField';
import type { FieldDef, ResourceDef } from './config';

type Row = Record<string, unknown> & { id: string; position?: number };
type FormValues = Record<string, unknown>;

function rowLabel(def: ResourceDef, r: Row): { title: string; sub: string; chip: string } {
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
  switch (def.table) {
    case 'shows': return { title: s('title'), sub: [s('group_name'), s('place')].filter(Boolean).join(' · '), chip: !r.published ? 'Oculto' : s('date') >= todayISO() ? 'Em breve' : 'Realizado' };
    case 'members': return { title: s('name'), sub: s('role'), chip: '' };
    case 'videos': return { title: s('title'), sub: s('who'), chip: '' };
    case 'podcasts': return { title: s('title'), sub: s('href'), chip: s('n') };
    default: return { title: s('caption'), sub: s('taken_when'), chip: '' };
  }
}

function toFormDefaults(def: ResourceDef, row?: Row): FormValues {
  const out: FormValues = { ...def.defaults };
  if (!row) return out;
  for (const key of Object.keys(def.defaults)) {
    const v = row[key];
    out[key] = v === null || v === undefined ? (typeof def.defaults[key] === 'boolean' ? true : '') : v;
  }
  if (typeof row.time === 'string') out.time = row.time.slice(0, 5);
  return out;
}

export function ResourceEditor({ def, onMessage }: { def: ResourceDef; onMessage: (m: string, ok: boolean) => void }) {
  const { content, reload } = useContent();
  const rows = ((content?.[def.table] ?? []) as unknown as Row[]).slice();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(def.schema as never) as unknown as Resolver<FormValues>, defaultValues: toFormDefaults(def) });
  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (editing === 'new') reset(toFormDefaults(def));
    else if (editing) reset(toFormDefaults(def, rows.find((r) => r.id === editing)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, def]);

  const run = async (action: () => Promise<void>, okMsg: string) => {
    setBusy(true);
    try { await action(); await reload(); onMessage(okMsg, true); return true; }
    catch (e) { onMessage(e instanceof Error ? e.message : 'Ação não concluída.', false); return false; }
    finally { setBusy(false); }
  };

  const onSubmit = async (values: FormValues) => {
    const original = editing === 'new' ? undefined : rows.find((r) => r.id === editing);
    if (def.dateRule && typeof values.date === 'string' && (!original || values.date !== original.date)) {
      const problem = def.dateRule(values.date);
      if (problem) { form.setError('date', { message: problem }); return; }
    }
    const ok = await run(
      () => (editing === 'new' ? createItem(def.table, values) : updateItem(def.table, editing as string, values)),
      'Salvo. O site já foi atualizado.',
    );
    if (ok) setEditing(null);
  };

  const move = async (index: number, delta: -1 | 1) => {
    const a = rows[index]; const b = rows[index + delta];
    if (!a || !b || a.position === undefined || b.position === undefined) return;
    await run(() => swapPositions(def.table, { id: a.id, position: a.position as number }, { id: b.id, position: b.position as number }), 'Ordem atualizada.');
  };

  const fieldError = (name: string) => (errors[name]?.message as string | undefined);

  const renderField = (f: FieldDef) => {
    const id = `${def.table}-${f.name}`;
    if (f.kind === 'image') {
      return <ImageField key={f.name} id={id} label={f.label} register={register(f.name)} control={control} name={f.name} error={fieldError(f.name)} onUploaded={(url) => setValue(f.name, url, { shouldValidate: true, shouldDirty: true })} />;
    }
    if (f.kind === 'checkbox') {
      return (
        <div className="field" key={f.name}>
          <label className="check" htmlFor={id}><input id={id} type="checkbox" {...register(f.name)} /><span>{f.label}</span></label>
        </div>
      );
    }
    return (
      <div className="field" key={f.name}>
        <label htmlFor={id}>{f.label}</label>
        {f.kind === 'textarea' ? (
          <textarea id={id} className="input" rows={4} aria-invalid={!!errors[f.name]} {...register(f.name)} />
        ) : f.kind === 'select' ? (
          <select id={id} className="input" {...register(f.name)}>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        ) : (
          <input id={id} className="input" type={f.kind === 'url' ? 'url' : f.kind === 'date' ? 'date' : f.kind === 'time' ? 'time' : 'text'} autoFocus={f.autoFocus} aria-invalid={!!errors[f.name]} {...register(f.name)} />
        )}
        {f.help && <span className="field__hint">{f.help}</span>}
        {fieldError(f.name) && <span className="field__error" role="alert">{fieldError(f.name)}</span>}
      </div>
    );
  };

  return (
    <div className="ed-card">
      <div className="ed-card__head">
        <div className="ed-card__title">{def.label} · {rows.length}</div>
        <button type="button" className="btn btn--magenta" onClick={() => setEditing('new')}>{def.newLabel}</button>
      </div>
      <p className="ed-hint">{def.hint}</p>

      {editing && (
        <form className="ed-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label={editing === 'new' ? def.newLabel : `Editar ${def.label}`}>
          <h3>{editing === 'new' ? def.newLabel.replace('+ ', '') : `Editar · ${def.label}`}</h3>
          {def.fields.map(renderField)}
          <div className="ed-actions">
            <button type="submit" className="btn btn--magenta" disabled={isSubmitting || busy}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <ul className="ed-list">
        {rows.length === 0 && <li className="empty">Nenhum item ainda.</li>}
        {rows.map((r, i) => {
          const l = rowLabel(def, r);
          const date = typeof r.date === 'string' ? formatDateBR(r.date) : `${i + 1}º`;
          return (
            <li key={r.id} className="ed-row">
              <div className="ed-row__date">{date}</div>
              <div className="ed-row__main"><strong>{l.title || '(sem título)'}</strong><span>{l.sub}</span></div>
              {l.chip && <span className="chip ed-row__chip">{l.chip}</span>}
              {confirm === r.id ? (
                <div className="ed-row__actions">
                  <span className="ed-row__ask">Excluir mesmo?</span>
                  <button type="button" className="btn btn--magenta" disabled={busy} onClick={() => void run(() => deleteItem(def.table, r.id), 'Excluído. O site já foi atualizado.').then(() => setConfirm(null))}>Sim, excluir</button>
                  <button type="button" className="btn btn--outline" onClick={() => setConfirm(null)}>Cancelar</button>
                </div>
              ) : (
                <div className="ed-row__actions">
                  {def.ordered && (
                    <>
                      <button type="button" className="btn btn--outline ed-icon" aria-label={`Subir ${l.title}`} disabled={busy || i === 0} onClick={() => void move(i, -1)}>↑</button>
                      <button type="button" className="btn btn--outline ed-icon" aria-label={`Descer ${l.title}`} disabled={busy || i === rows.length - 1} onClick={() => void move(i, 1)}>↓</button>
                    </>
                  )}
                  <button type="button" className="btn btn--yellow" aria-label={`Editar ${l.title}`} onClick={() => setEditing(r.id)}>Editar</button>
                  <button type="button" className="btn btn--outline" aria-label={`Excluir ${l.title}`} onClick={() => setConfirm(r.id)}>Excluir</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
