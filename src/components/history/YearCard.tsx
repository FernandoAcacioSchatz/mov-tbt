import { Link } from 'react-router-dom';
import type { HistoryYear } from '../../types/content';
import { thumbUrl } from './historyUtils';

function counts(y: HistoryYear): string {
  return [
    y.postagens && `${y.postagens} ${y.postagens === 1 ? 'postagem' : 'postagens'}`,
    y.filipetas && `${y.filipetas} ${y.filipetas === 1 ? 'filipeta' : 'filipetas'}`,
    y.clipagens && `${y.clipagens} ${y.clipagens === 1 ? 'clipagem' : 'clipagens'}`,
    y.midia && `${y.midia} na mídia`,
  ].filter(Boolean).join(' · ');
}

/** Cartão de um ano da História: capa (foto do 1º espetáculo do ano), o ano em destaque e o que há nele. */
export function YearCard({ year, color }: { year: HistoryYear; color: string }) {
  const cover = thumbUrl(year.cover_url);
  return (
    <Link to={`/historia/${year.year}`} className="year-card" style={{ background: color }} aria-label={`${year.year}: ${counts(year)}`}>
      {cover && <img className="year-card__img" src={cover} alt="" loading="lazy" />}
      <span className="year-card__shade" aria-hidden="true" />
      <span className="year-card__body">
        <span className="year-card__year">{year.year}</span>
        <span className="year-card__counts">{counts(year)}</span>
      </span>
    </Link>
  );
}
