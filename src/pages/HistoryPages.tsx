import { Link, useParams } from 'react-router-dom';
import { HistoryLayout, LoadingOrError } from '../components/history/HistoryLayout';
import { Gallery } from '../components/history/Gallery';
import { YearCard } from '../components/history/YearCard';
import { KIND_LABEL, paragraphs, parseYear, thumbUrl } from '../components/history/historyUtils';
import { useLoad } from '../hooks/useLoad';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTexts } from '../hooks/useTexts';
import {
  fetchHistoryYears, fetchIntro, fetchPostWithNeighbors, fetchYearClippings, fetchYearFlyers, fetchYearPosts,
} from '../services/historyService';
import { formatPreciseDate } from '../utils/dates';
import { safeUrl } from '../utils/url';
import { accentColor } from '../utils/format';
import type { HistoryKind, HistoryPost } from '../types/content';
import { NotFoundPage } from './NotFoundPage';

const SITE = 'Movimento TBT';

function postDate(p: Pick<HistoryPost, 'event_date' | 'date_precision' | 'date_label'>): string {
  return p.date_label || formatPreciseDate(p.event_date, p.date_precision);
}

/** /historia — todos os anos que têm conteúdo. */
export function HistoryIndexPage() {
  useDocumentTitle(`História — ${SITE}`);
  const t = useTexts();
  const years = useLoad(fetchHistoryYears, []);
  return (
    <HistoryLayout crumbs={[{ label: 'História' }]}>
      <section className="container section history__section" aria-labelledby="h-title">
        <div className="kicker kicker--magenta">{t('historiaKicker') || 'História'}</div>
        <h1 id="h-title" className="h2">{t('historiaTitle') || 'Nossa história'}</h1>
        <p className="lead history__lead">Escolha um ano para ver as postagens, as filipetas e as clipagens daquela temporada.</p>
        <LoadingOrError loading={years.loading} error={years.error} />
        {years.data?.length === 0 && <p className="empty">Em breve.</p>}
        <ul className="years-grid">
          {years.data?.map((y, i) => <li key={y.year}><YearCard year={y} color={accentColor(i)} /></li>)}
        </ul>
      </section>
    </HistoryLayout>
  );
}

/** /historia/:ano — as três portas (só as que têm conteúdo). */
export function HistoryYearPage() {
  const year = parseYear(useParams().ano);
  useDocumentTitle(`História ${year ?? ''} — ${SITE}`);
  const years = useLoad(fetchHistoryYears, []);
  if (year === null) return <NotFoundPage />;
  const info = years.data?.find((y) => y.year === year);
  const doors: { kind: HistoryKind; count: number; text: string }[] = info ? [
    { kind: 'postagens', count: info.postagens, text: info.postagens === 1 ? 'espetáculo / acontecimento' : 'espetáculos e acontecimentos' },
    { kind: 'filipetas', count: info.filipetas, text: info.filipetas === 1 ? 'filipeta' : 'filipetas' },
    { kind: 'clipagens', count: info.clipagens, text: info.clipagens === 1 ? 'recorte de jornal' : 'recortes de jornal' },
  ].filter((d) => d.count > 0) as { kind: HistoryKind; count: number; text: string }[] : [];

  return (
    <HistoryLayout crumbs={[{ label: 'História', to: '/historia' }, { label: String(year) }]} year={year}>
      <section className="container section history__section" aria-labelledby="y-title">
        <h1 id="y-title" className="h2 history__year">{year}</h1>
        <LoadingOrError loading={years.loading} error={years.error} />
        {years.data && !info && <p className="empty">Ainda não há nada cadastrado em {year}.</p>}
        <ul className="doors">
          {doors.map((d, i) => (
            <li key={d.kind}>
              <Link to={`/historia/${year}/${d.kind}`} className="door" style={{ ['--door-color' as string]: accentColor(i) }}>
                <span className="door__label">{KIND_LABEL[d.kind]}</span>
                <span className="door__count"><strong>{d.count}</strong> {d.text}</span>
                <span className="door__go" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </HistoryLayout>
  );
}

/** /historia/:ano/postagens — lista em ordem cronológica. */
export function HistoryPostsPage() {
  const year = parseYear(useParams().ano);
  useDocumentTitle(`Postagens de ${year ?? ''} — ${SITE}`);
  const posts = useLoad(() => (year ? fetchYearPosts(year) : Promise.resolve([])), [year]);
  if (year === null) return <NotFoundPage />;
  return (
    <HistoryLayout crumbs={[{ label: 'História', to: '/historia' }, { label: String(year), to: `/historia/${year}` }, { label: 'Postagens' }]} year={year}>
      <section className="container section history__section" aria-labelledby="p-title">
        <div className="kicker kicker--magenta">{year}</div>
        <h1 id="p-title" className="h2">Postagens</h1>
        <LoadingOrError loading={posts.loading} error={posts.error} />
        {posts.data?.length === 0 && <p className="empty">Nenhuma postagem em {year}.</p>}
        <ol className="timeline">
          {posts.data?.map((p) => {
            const cover = thumbUrl(p.cover_url);
            return (
              <li key={p.id} className="timeline__item">
                <span className="timeline__date">{formatPreciseDate(p.event_date, p.date_precision)}</span>
                <Link to={`/historia/${year}/postagens/${p.slug}`} className="tl-card">
                  <span className="tl-card__thumb">{cover && <img src={cover} alt="" loading="lazy" />}</span>
                  <span className="tl-card__body">
                    <span className="tl-card__title">{p.title}</span>
                    {(p.group_name || p.city) && <span className="tl-card__meta">{[p.group_name, p.city].filter(Boolean).join(' · ')}</span>}
                    {p.date_label && <span className="tl-card__meta">{p.date_label}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </HistoryLayout>
  );
}

/** /historia/:ano/postagens/:slug — postagem completa com fotos e anterior/próxima. */
export function HistoryPostPage() {
  const { ano, slug = '' } = useParams();
  const year = parseYear(ano);
  const res = useLoad(() => fetchPostWithNeighbors(slug), [slug]);
  const post = res.data?.post;
  useDocumentTitle(post ? `${post.title} — ${SITE}` : `História — ${SITE}`);
  if (year === null || (!res.loading && !res.error && !post)) return <NotFoundPage />;
  const realYear = post ? Number(post.event_date.slice(0, 4)) : year;
  const cover = safeUrl(post?.cover_url);
  const photos = (post?.photos ?? []).filter((src) => src !== post?.cover_url);
  const link = (p: { slug: string; event_date: string }) => `/historia/${p.event_date.slice(0, 4)}/postagens/${p.slug}`;

  return (
    <HistoryLayout
      crumbs={[{ label: 'História', to: '/historia' }, { label: String(realYear), to: `/historia/${realYear}` }, { label: 'Postagens', to: `/historia/${realYear}/postagens` }, { label: post?.title ?? '…' }]}
      year={realYear}
    >
      <LoadingOrError loading={res.loading} error={res.error} />
      {post && (
        <article className="container section history__section post" aria-labelledby="post-title">
          <div className="kicker kicker--magenta">{postDate(post)}</div>
          <h1 id="post-title" className="post__title">{post.title}</h1>
          {(post.group_name || post.city || post.venue) && (
            <p className="post__meta">{[post.group_name, post.city, post.venue].filter(Boolean).join(' · ')}</p>
          )}
          <div className="post__layout">
            {cover && <img className="post__cover" src={cover} alt={`Imagem de ${post.title}`} />}
            <div className="post__text prose">
              {paragraphs(post.body).map((p, i) => <p key={i} className="pre-line">{p}</p>)}
            </div>
          </div>
          {photos.length > 0 && (
            <>
              <h2 className="post__subtitle">Fotos</h2>
              <Gallery items={photos.map((src, i) => ({ id: `${i}`, src }))} label={`Fotos de ${post.title}`} />
            </>
          )}
          <nav className="pager" aria-label="Outras postagens">
            {res.data?.prev ? <Link to={link(res.data.prev)} className="pager__link"><small>← Anterior · {res.data.prev.event_date.slice(0, 4)}</small>{res.data.prev.title}</Link> : <span />}
            {res.data?.next ? <Link to={link(res.data.next)} className="pager__link pager__link--next"><small>Próxima · {res.data.next.event_date.slice(0, 4)} →</small>{res.data.next.title}</Link> : <span />}
          </nav>
        </article>
      )}
    </HistoryLayout>
  );
}

/** /historia/:ano/filipetas e /historia/:ano/clipagens — galerias em ordem cronológica. */
export function HistoryGalleryPage({ kind }: { kind: 'filipetas' | 'clipagens' }) {
  const year = parseYear(useParams().ano);
  useDocumentTitle(`${KIND_LABEL[kind]} de ${year ?? ''} — ${SITE}`);
  const data = useLoad(async () => {
    if (!year) return { intro: null, items: [] };
    const [intro, items] = await Promise.all([
      fetchIntro(year, kind),
      kind === 'filipetas'
        ? fetchYearFlyers(year).then((r) => r.map((f) => ({ id: f.id, src: f.image_url, caption: f.caption, meta: formatPreciseDate(f.event_date, f.date_precision) })))
        : fetchYearClippings(year).then((r) => r.map((c) => ({ id: c.id, src: c.image_url, caption: c.caption, meta: [c.newspaper, formatPreciseDate(c.event_date, c.date_precision)].filter(Boolean).join(' · ') }))),
    ]);
    return { intro, items };
  }, [year, kind]);
  if (year === null) return <NotFoundPage />;

  return (
    <HistoryLayout crumbs={[{ label: 'História', to: '/historia' }, { label: String(year), to: `/historia/${year}` }, { label: KIND_LABEL[kind] }]} year={year}>
      <section className="container section history__section" aria-labelledby="g-title">
        <div className="kicker kicker--magenta">{year}</div>
        <h1 id="g-title" className="h2">{KIND_LABEL[kind]}</h1>
        <LoadingOrError loading={data.loading} error={data.error} />
        {data.data?.intro && (
          <div className="history__intro prose">{paragraphs(data.data.intro).map((p, i) => <p key={i} className="pre-line">{p}</p>)}</div>
        )}
        {data.data?.items.length === 0 && <p className="empty">Nada cadastrado aqui em {year}.</p>}
        {data.data && data.data.items.length > 0 && <Gallery items={data.data.items} label={`${KIND_LABEL[kind]} de ${year}`} />}
      </section>
    </HistoryLayout>
  );
}
