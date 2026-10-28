import { useState } from 'react';
import { saveTexts } from '../services/contentService';
import { useContent } from '../hooks/useContent';
import { TEXT_MAX, textValueSchema } from '../schemas/resourceSchemas';
import { safeUrl } from '../utils/url';
import { uploadImage } from '../services/storageService';
import { URL_TEXT_KEYS, type TextField } from './config';

/** Contador de caracteres que acompanha a digitação; fica vermelho acima do limite. */
function CharCount({ id, length }: { id: string; length: number }) {
  const over = length > TEXT_MAX;
  return (
    <span id={id} className={over ? 'field__count field__count--over' : 'field__count'}>
      {length.toLocaleString('pt-BR')} / {TEXT_MAX.toLocaleString('pt-BR')} caracteres{over && ` — ${(length - TEXT_MAX).toLocaleString('pt-BR')} acima do limite`}
    </span>
  );
}

/** Imagem guardada entre os textos (ex.: logos). Vazio = o site usa a imagem original. */
function TextImageInput({ id, value, invalid, onChange }: { id: string; value: string; invalid: boolean; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const preview = safeUrl(value, { httpsOnly: true });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      onChange(await uploadImage(file));
      setMsg('Imagem enviada. Clique em “Salvar textos” para aplicar no site.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input id={id} className="input" type="url" inputMode="url" placeholder="Vazio = logo original do site" value={value} aria-invalid={invalid} onChange={(e) => onChange(e.target.value)} />
      <div className="image-field__row">
        <label className="btn btn--outline btn--small" htmlFor={`${id}-file`}>{busy ? 'Enviando…' : 'Enviar do computador'}</label>
        <input id={`${id}-file`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} />
        {value !== '' && <button type="button" className="btn btn--outline btn--small" onClick={() => { onChange(''); setMsg('Clique em “Salvar textos” para voltar à logo original.'); }}>Usar a original</button>}
        {preview && <img className="image-field__preview" src={preview} alt="Prévia da imagem" />}
      </div>
      {msg && <span className="field__hint" role="status">{msg}</span>}
    </>
  );
}

export function TextFieldsEditor({ fields, onMessage }: { fields: TextField[]; onMessage: (m: string, ok: boolean) => void }) {
  const { content, reload } = useContent();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, content?.texts[f.key] ?? ''])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.key] ?? '';
      const r = textValueSchema.safeParse(v);
      if (!r.success) nextErrors[f.key] = r.error.issues[0]?.message ?? 'Valor inválido.';
      if (URL_TEXT_KEYS.has(f.key) && v.trim() !== '' && !safeUrl(v)) nextErrors[f.key] = 'Use um endereço que comece com https://';
      if (f.kind === 'img' && v.trim() !== '' && !safeUrl(v, { httpsOnly: true })) nextErrors[f.key] = 'Use um endereço que comece com https://';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) { onMessage('Confira os campos destacados.', false); return; }
    setSaving(true);
    try {
      await saveTexts(values);
      await reload();
      onMessage('Textos salvos. O site já foi atualizado.', true);
    } catch (err) {
      onMessage(err instanceof Error ? err.message : 'Não foi possível salvar.', false);
    } finally {
      setSaving(false);
    }
  };

  if (fields.length === 0) return null;
  return (
    <form className="ed-card" onSubmit={(e) => void save(e)} aria-label="Textos da seção">
      <div className="ed-card__title">Textos</div>
      <p className="ed-hint">
        Dica: escreva <code>{'{integrantes}'}</code> para mostrar a quantidade de integrantes cadastrados,
        {' '}<code>{'{anos}'}</code> para os anos desde 2005 e <code>{'{ano}'}</code> para o ano atual. Eles se atualizam sozinhos.
      </p>
      {fields.map((f) => (
        <div className="field" key={f.key}>
          <label htmlFor={`tx-${f.key}`}>{f.label}</label>
          {f.kind === 'img' ? (
            <TextImageInput id={`tx-${f.key}`} value={values[f.key] ?? ''} invalid={!!errors[f.key]} onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))} />
          ) : f.kind === 'i' ? (
            <input id={`tx-${f.key}`} className="input" type="text" value={values[f.key] ?? ''} aria-invalid={!!errors[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          ) : (
            <>
              <textarea id={`tx-${f.key}`} className="input" rows={f.kind === 'A' ? 7 : 3} value={values[f.key] ?? ''} aria-invalid={!!errors[f.key]} aria-describedby={`tx-${f.key}-count`} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              <CharCount id={`tx-${f.key}-count`} length={(values[f.key] ?? '').length} />
            </>
          )}
          {errors[f.key] && <span className="field__error" role="alert">{errors[f.key]}</span>}
        </div>
      ))}
      <div><button type="submit" className="btn btn--magenta" disabled={saving}>{saving ? 'Salvando…' : 'Salvar textos'}</button></div>
    </form>
  );
}
