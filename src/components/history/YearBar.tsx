import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { HistoryYear } from '../../types/content';

/** Barra com os anos que têm conteúdo, em ordem. O ano aberto fica destacado e visível. */
export function YearBar({ years, current }: { years: HistoryYear[]; current?: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [current]);
  if (years.length === 0) return null;
  return (
    <nav ref={ref} className="yearbar noscroll" aria-label="Anos da História">
      {years.map((y) => (
        <Link key={y.year} to={`/historia/${y.year}`} className="yearbar__item" aria-current={y.year === current ? 'page' : undefined}>
          {y.year}
        </Link>
      ))}
    </nav>
  );
}
