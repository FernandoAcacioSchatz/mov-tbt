import { useEffect } from 'react';

/** Pede aos buscadores para não indexar páginas privadas. */
export function NoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);
  return null;
}
