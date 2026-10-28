import { useEffect, useState } from 'react';

/** Menor fração do tamanho original; abaixo disso a linha volta a quebrar. */
const MIN_SCALE = 0.4;

/**
 * Encolhe a fonte de um título até cada linha (filhos com `width: max-content`)
 * caber na largura dele. Grava a fração em `--fit`, que o CSS multiplica pelo
 * tamanho base; se nem no mínimo couber, marca `data-fit-wrap` para quebrar.
 */
export function useFitText(deps: unknown[]) {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!el) return undefined;
    let frame = 0;
    const fit = () => {
      el.style.setProperty('--fit', '1');
      el.removeAttribute('data-fit-wrap');
      const available = el.clientWidth;
      const widest = Math.max(0, ...Array.from(el.children, (c) => (c as HTMLElement).offsetWidth));
      if (!available || widest <= available) return;
      const scale = Math.floor((available / widest) * 1000) / 1000;
      el.style.setProperty('--fit', String(Math.max(scale, MIN_SCALE)));
      if (scale < MIN_SCALE) el.setAttribute('data-fit-wrap', '');
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); };
    fit();
    // a fonte do título carrega depois e muda a largura das letras
    document.fonts?.ready.then(schedule).catch(() => {});
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, ...deps]);

  return setEl;
}
