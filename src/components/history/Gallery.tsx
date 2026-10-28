import { useCallback, useEffect, useRef, useState } from 'react';
import { safeUrl } from '../../utils/url';
import { thumbUrl } from './historyUtils';

export interface GalleryItem { id: string; src: string; caption?: string | null; meta?: string | null }

/** Grade de imagens; ao tocar, abre ampliada com setas (teclado: ← → Esc). */
export function Gallery({ items, label }: { items: GalleryItem[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => { dialog.current?.close(); }, []);
  const go = useCallback((delta: number) => {
    setOpen((i) => (i === null ? i : (i + delta + items.length) % items.length));
  }, [items.length]);

  useEffect(() => {
    const d = dialog.current;
    if (open !== null && d && !d.open) d.showModal?.();
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  const current = open === null ? null : items[open];

  return (
    <>
      <ul className="gallery" aria-label={label}>
        {items.map((it, i) => (
          <li key={it.id} className="gallery__item">
            <button
              type="button"
              className="gallery__open"
              onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}
              aria-label={`Ampliar ${it.caption || `imagem ${i + 1}`}`}
            >
              <img src={thumbUrl(it.src)} alt={it.caption ?? ''} loading="lazy" />
            </button>
            {(it.caption || it.meta) && (
              <p className="gallery__caption">
                {it.caption && <strong>{it.caption}</strong>}
                {it.meta && <span>{it.meta}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={current?.caption || label}
        onClose={() => { setOpen(null); opener.current?.focus(); }}
        onKeyDown={onKey}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        {current && (
          <div className="lightbox__inner">
            <img className="lightbox__img" src={safeUrl(current.src)} alt={current.caption ?? ''} />
            <div className="lightbox__bar">
              <p className="lightbox__caption">
                {current.caption && <strong>{current.caption}</strong>}
                {current.meta && <span>{current.meta}</span>}
                <span>{(open ?? 0) + 1} de {items.length}</span>
              </p>
              <div className="lightbox__actions">
                {items.length > 1 && <button type="button" className="arrow" onClick={() => go(-1)} aria-label="Imagem anterior">←</button>}
                {items.length > 1 && <button type="button" className="arrow" onClick={() => go(1)} aria-label="Próxima imagem">→</button>}
                <button type="button" className="arrow arrow--pause" onClick={close} aria-label="Fechar">✕</button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
