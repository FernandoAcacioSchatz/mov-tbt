import { useState } from 'react';
import { useWatch, type Control, type FieldValues, type UseFormRegisterReturn } from 'react-hook-form';
import { uploadImage } from '../services/storageService';
import { safeUrl } from '../utils/url';

interface Props {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  control: Control<FieldValues>;
  name: string;
  error?: string;
  onUploaded: (url: string) => void;
}

export function ImageField({ id, label, register, control, name, error, onUploaded }: Props) {
  const value = String(useWatch({ control, name }) ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      onUploaded(await uploadImage(file));
      setMsg('Imagem enviada.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type="url" inputMode="url" placeholder="https://…" aria-invalid={!!error} {...register} />
      <div className="image-field__row">
        <label className="btn btn--outline btn--small" htmlFor={`${id}-file`}>{busy ? 'Enviando…' : 'Enviar do computador'}</label>
        <input id={`${id}-file`} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0])} />
        {safeUrl(value, { httpsOnly: true }) && <img className="image-field__preview" src={safeUrl(value, { httpsOnly: true })} alt="Prévia da imagem" />}
      </div>
      {msg && <span className="field__hint" role="status">{msg}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  );
}
