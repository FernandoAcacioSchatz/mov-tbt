import { useState } from 'react';
import { useWatch, type Control, type FieldValues, type UseFormSetValue } from 'react-hook-form';
import { uploadImage } from '../services/storageService';
import { safeUrl } from '../utils/url';

/** Lista de fotos de uma postagem: enviar várias de uma vez, remover e mudar a ordem. */
export function PhotosField({ id, control, setValue, error }: {
  id: string;
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  error?: string;
}) {
  const photos = (useWatch({ control, name: 'photos' }) ?? []) as string[];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const update = (next: string[]) => setValue('photos', next, { shouldValidate: true, shouldDirty: true });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true); setMsg(null);
    const added: string[] = [];
    try {
      for (const f of Array.from(files)) added.push(await uploadImage(f));
      setMsg(`${added.length} foto(s) enviada(s).`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      if (added.length) update([...photos, ...added]);
      setBusy(false);
    }
  };

  const move = (i: number, delta: -1 | 1) => {
    const next = photos.slice();
    const j = i + delta;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j] as string, next[i] as string];
    update(next);
  };

  return (
    <div className="field">
      <span className="label">Fotos da postagem ({photos.length})</span>
      {photos.length > 0 && (
        <ul className="photos-field">
          {photos.map((src, i) => (
            <li key={`${src}-${i}`} className="photos-field__item">
              {safeUrl(src) && <img src={safeUrl(src)} alt={`Foto ${i + 1}`} />}
              <div className="photos-field__actions">
                <button type="button" className="btn btn--outline btn--small ed-icon" aria-label={`Mover foto ${i + 1} para antes`} disabled={i === 0} onClick={() => move(i, -1)}>←</button>
                <button type="button" className="btn btn--outline btn--small ed-icon" aria-label={`Mover foto ${i + 1} para depois`} disabled={i === photos.length - 1} onClick={() => move(i, 1)}>→</button>
                <button type="button" className="btn btn--outline btn--small" aria-label={`Remover foto ${i + 1}`} onClick={() => update(photos.filter((_, k) => k !== i))}>Remover</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="image-field__row">
        <label className="btn btn--outline btn--small" htmlFor={`${id}-files`}>{busy ? 'Enviando…' : '+ Enviar fotos do computador'}</label>
        <input id={`${id}-files`} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {msg && <span className="field__hint" role="status">{msg}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  );
}
