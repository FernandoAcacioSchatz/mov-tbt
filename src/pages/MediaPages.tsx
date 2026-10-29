import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { LoadingOrError, type Crumb } from '../components/history/HistoryLayout';
import { Gallery } from '../components/history/Gallery';
import { MediaCard } from '../components/media/MediaCard';
import { MediaEmpty } from '../components/media/MediaEmpty';
import { MEDIA_TYPE_LABEL, paragraphs } from '../components/history/historyUtils';
import { SafeLink } from '../components/ui/SafeLink';
import { useLoad } from '../hooks/useLoad';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTexts } from '../hooks/useTexts';
import { fetchMedia, fetchMediaItem } from '../services/historyService';
import { formatPreciseDate } from '../utils/dates';
import { safeUrl } from '../utils/url';
import { accentColor } from '../utils/format';
import { NotFoundPage } from './NotFoundPage';

const SITE = 'Movimento TBT';

function MediaLayout({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" className="history">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <ol>
              <li><Link to="/">Início</Link></li>
              {crumbs.map((c) => (
                <li key={c.label}>{c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        </div>
        {children}
      </main>
      <Footer />
    </>
  );
}

/** /midias — tudo o que saiu sobre a TBT na mídia, das mais recentes para as mais antigas. */
export function MediaIndexPage() {
  useDocumentTitle(`Mídias — ${SITE}`);
  const t = useTexts();
  const res = useLoad(() => fetchMedia(), []);
  const items = (res.data ?? []).filter((m) => m.published);
  return (
    <MediaLayout crumbs={[{ label: 'Mídias' }]}>
      <section className="container section history__section" aria-labelledby="m-title">
        <h1 id="m-title" className="h2">{t('namidiaTitle') || 'Mídias'}</h1>
        <p className="lead history__lead">
          {t('namidiaText') || 'A TBT nos jornais, na TV, nos sites e nas redes: matérias, entrevistas, vídeos e postagens sobre o movimento.'}
        </p>
        <LoadingOrError loading={res.loading} error={res.error} />
        {res.data && items.length === 0 && <MediaEmpty />}
        <ul className="media-grid" aria-label="TBT na mídia">
          {items.map((m, i) => <li key={m.id}><MediaCard item={m} color={accentColor(i)} /></li>)}
        </ul>
      </section>
    </MediaLayout>
  );
}

/** /midias/:id — o item completo: texto, fotos e os links para a publicação e o vídeo. */
export function MediaItemPage() {
  const { id = '' } = useParams();
  const res = useLoad(() => fetchMediaItem(id), [id]);
  const item = res.data?.published ? res.data : null;
  useDocumentTitle(item ? `${item.title} — ${SITE}` : `Mídias — ${SITE}`);
  if (!res.loading && !res.error && !item) return <NotFoundPage />;
  const cover = safeUrl(item?.image_url);
  const photos = (item?.photos ?? []).filter((src) => src !== item?.image_url);
  const year = item?.event_date.slice(0, 4);

  return (
    <MediaLayout crumbs={[{ label: 'Mídias', to: '/midias' }, { label: item?.title ?? '…' }]}>
      <LoadingOrError loading={res.loading} error={res.error} />
      {item && (
        <article className="container section history__section post" aria-labelledby="mi-title">
          <div className="kicker kicker--magenta">{MEDIA_TYPE_LABEL[item.media_type]} · {formatPreciseDate(item.event_date, item.date_precision)}</div>
          <h1 id="mi-title" className="post__title">{item.title}</h1>
          {item.outlet && <p className="post__meta">{item.outlet}</p>}
          <div className="media-item__links">
            {safeUrl(item.url) && <SafeLink href={item.url} className="btn btn--magenta">Ver publicação original ↗</SafeLink>}
            {safeUrl(item.video_url) && <SafeLink href={item.video_url} className="btn btn--yellow">Assistir ao vídeo ↗</SafeLink>}
            <Link to={`/historia/${year}/midia`} className="btn btn--outline">Na História de {year} →</Link>
          </div>
          <div className="post__layout">
            {cover && <img className="post__cover" src={cover} alt={`Imagem de ${item.title}`} />}
            <div className="post__text prose">
              {paragraphs(item.body).map((p, i) => <p key={i} className="pre-line">{p}</p>)}
            </div>
          </div>
          {photos.length > 0 && (
            <>
              <h2 className="post__subtitle">Fotos</h2>
              <Gallery items={photos.map((src, i) => ({ id: `${i}`, src }))} label={`Fotos de ${item.title}`} />
            </>
          )}
        </article>
      )}
    </MediaLayout>
  );
}
