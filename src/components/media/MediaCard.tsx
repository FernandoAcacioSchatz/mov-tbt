import { Link } from 'react-router-dom';
import { MEDIA_TYPE_LABEL, mediaCover } from '../history/historyUtils';
import { formatPreciseDate } from '../../utils/dates';
import type { HistoryMedia } from '../../types/content';

/** Cartão de um item da TBT na mídia: capa, tipo, veículo, título e data. Abre a página do item. */
export function MediaCard({ item, color }: { item: HistoryMedia; color: string }) {
  const cover = mediaCover(item);
  return (
    <Link to={`/midias/${item.id}`} className="media-card">
      <span className="media-card__cover" style={{ background: color }}>
        {cover && <img src={cover} alt="" loading="lazy" />}
        <span className="media-card__type">{MEDIA_TYPE_LABEL[item.media_type]}</span>
        {item.media_type === 'video' && <span className="media-card__play" aria-hidden="true">▶</span>}
      </span>
      <span className="media-card__body">
        {item.outlet && <span className="media-card__outlet">{item.outlet}</span>}
        <span className="media-card__title">{item.title}</span>
        <span className="media-card__date">{formatPreciseDate(item.event_date, item.date_precision)}</span>
      </span>
    </Link>
  );
}
