import { useMemo } from 'react';
import { useContent } from '../hooks/useContent';
import { useTexts } from '../hooks/useTexts';
import { useScrollCarousel } from '../hooks/useScrollCarousel';
import { EditButton } from '../components/ui/EditButton';
import { CarouselControls } from '../components/ui/CarouselControls';
import { dateParts, sortShows, todayISO, accentColor } from '../utils/format';
import { safeUrl } from '../utils/url';
import { Link } from 'react-router-dom';
import { SafeLink } from '../components/ui/SafeLink';

export function Agenda() {
  const { content } = useContent();
  const t = useTexts();
  const shows = useMemo(() => sortShows((content?.shows ?? []).filter((s) => s.published)), [content]);
  const { setTrack, index, next, prev, goTo, onScroll, paused, togglePause, hoverHandlers } = useScrollCarousel({ count: shows.length, interval: 6000 });
  const today = todayISO();

  return (
    <section id="agenda" className="section" aria-labelledby="agenda-title">
      <EditButton section="agenda" />
      <div className="container">
        <div className="section__head">
          <h2 id="agenda-title" className="h2" style={{ marginBottom: 'var(--space-3)' }}>{t('agendaTitle')}</h2>
          {shows.length > 1 && <CarouselControls onPrev={prev} onNext={next} paused={paused} onTogglePause={togglePause} label="agenda" />}
        </div>
        <p className="lead" style={{ maxWidth: '38.75rem', marginBottom: 'var(--space-7)' }}>{t('agendaText')}</p>

        {shows.length === 0 ? (
          <div className="agenda-empty">
            <span className="agenda-empty__light agenda-empty__light--yellow" aria-hidden="true" />
            <span className="agenda-empty__light agenda-empty__light--teal" aria-hidden="true" />
            <span className="agenda-empty__light agenda-empty__light--pink" aria-hidden="true" />
            <div className="agenda-empty__art" aria-hidden="true">
              <img src="/images/mascaras.webp" alt="" width={640} height={605} loading="lazy" />
            </div>
            <div className="agenda-empty__body">
              <span className="agenda-empty__kicker">Próxima temporada</span>
              <h3 className="agenda-empty__title">{t('agendaVazioTitulo') || 'A cortina já vai abrir'}</h3>
              <p className="agenda-empty__text">
                {t('agendaVazioTexto') || 'Estamos preparando os próximos espetáculos. Enquanto isso, reviva os espetáculos, as filipetas e as histórias que já passaram pelo palco do movimento.'}
              </p>
              <div className="agenda-empty__actions">
                <Link className="btn btn--lg btn--yellow" to="/historia">Reviver a História →</Link>
                {safeUrl(t('socInstagram')) && (
                  <SafeLink href={t('socInstagram')} className="btn btn--lg agenda-empty__ghost">Acompanhar no Instagram ↗</SafeLink>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }} role="region" aria-roledescription="carrossel" aria-label="Espetáculos em cartaz" {...hoverHandlers}>
            <div ref={setTrack} className="slides noscroll" onScroll={onScroll} aria-live={paused ? 'polite' : 'off'}>
              {shows.map((s, i) => {
                const color = accentColor(i);
                const parts = dateParts(s.date);
                const img = safeUrl(s.image_url);
                const upcoming = s.date >= today;
                return (
                  <article key={s.id} className="slide" style={{ background: color }} aria-roledescription="slide" aria-label={`${i + 1} de ${shows.length}`}>
                    {img && <img className="slide__img" src={img} alt="" loading={i === 0 ? 'eager' : 'lazy'} />}
                    <div className="slide__shade" />
                    <div className="slide__date" style={{ background: color }}>
                      <strong>{parts.day}</strong>
                      <span>{parts.month} {parts.year}</span>
                    </div>
                    <div className="slide__body">
                      <div className="slide__meta" style={{ color }}>{upcoming ? 'Em breve' : 'Realizado'}{s.group_name ? ` · ${s.group_name}` : ''}</div>
                      <h3 className="slide__title">{s.title}</h3>
                      {s.description && <p className="slide__desc">{s.description}</p>}
                      <div className="slide__info">
                        {s.time && <>⏱ {s.time}</>}{s.place && <> &nbsp;·&nbsp; ◉ {s.place}</>}{s.price && <> &nbsp;·&nbsp; ✦ {s.price}</>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {shows.length > 1 && (
              <div className="dots">
                {shows.map((s, i) => (
                  <button key={s.id} type="button" className="dot" aria-label={`Ir para o espetáculo ${i + 1}`} aria-current={i === index} onClick={() => goTo(i)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
