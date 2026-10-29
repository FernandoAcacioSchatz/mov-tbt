import { useMemo } from 'react';
import { useContent } from '../hooks/useContent';
import { useTexts } from '../hooks/useTexts';
import { useScrollCarousel } from '../hooks/useScrollCarousel';
import { EditButton } from '../components/ui/EditButton';
import { dateParts, sortShows, todayISO, accentColor } from '../utils/format';
import { safeUrl } from '../utils/url';
import { Link } from 'react-router-dom';
import { SafeLink } from '../components/ui/SafeLink';

/** "sábado, 14 de março de 2026" — a data por extenso da ficha do espetáculo. */
function longDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function Agenda() {
  const { content } = useContent();
  const t = useTexts();
  const shows = useMemo(() => sortShows((content?.shows ?? []).filter((s) => s.published)), [content]);
  const { setTrack, index, next, prev, goTo, onScroll, paused, hoverHandlers } = useScrollCarousel({ count: shows.length, interval: 6000 });
  const today = todayISO();

  return (
    <section id="agenda" className="section" aria-labelledby="agenda-title">
      <EditButton section="agenda" />
      <div className="container">
        <div className="section__head">
          <h2 id="agenda-title" className="h2" style={{ marginBottom: 'var(--space-3)' }}>{t('agendaTitle')}</h2>
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
          <div className="shows" role="region" aria-roledescription="carrossel" aria-label="Espetáculos em cartaz" {...hoverHandlers}>
            <div className="shows__stage">
              <div ref={setTrack} className="shows__track noscroll" onScroll={onScroll} aria-live={paused ? 'polite' : 'off'}>
                {shows.map((s, i) => {
                  const color = accentColor(i);
                  const parts = dateParts(s.date);
                  const img = safeUrl(s.image_url);
                  const upcoming = s.date >= today;
                  return (
                    <article key={s.id} className="show" aria-roledescription="slide" aria-label={`${i + 1} de ${shows.length}`}>
                      <div className="show__poster" style={{ background: color }}>
                        {img ? (
                          <img src={img} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                        ) : (
                          <span className="show__poster-mark" aria-hidden="true">{s.title.charAt(0)}</span>
                        )}
                        <span className={`show__status${upcoming ? ' show__status--soon' : ''}`}>{upcoming ? 'Em breve' : 'Realizado'}</span>
                      </div>
                      <div className="show__info">
                        <div className="show__head">
                          <div className="show__date" style={{ background: color }}>
                            <strong>{parts.day}</strong>
                            <span>{parts.month}</span>
                          </div>
                          <div>
                            {s.group_name && <p className="show__group">{s.group_name}</p>}
                            <h3 className="show__title">{s.title}</h3>
                          </div>
                        </div>
                        {s.description && <p className="show__desc">{s.description}</p>}
                        <dl className="show__specs">
                          <div className="show__spec">
                            <dt>Data</dt>
                            <dd>{longDate(s.date)}</dd>
                          </div>
                          {s.time && (
                            <div className="show__spec">
                              <dt>Horário</dt>
                              <dd>{s.time}</dd>
                            </div>
                          )}
                          {s.place && (
                            <div className="show__spec show__spec--wide">
                              <dt>Local</dt>
                              <dd>{s.place}</dd>
                            </div>
                          )}
                          {s.price && (
                            <div className="show__spec show__spec--wide">
                              <dt>Ingresso</dt>
                              <dd>{s.price}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </article>
                  );
                })}
              </div>
              {shows.length > 1 && (
                <>
                  <button type="button" className="arrow shows__arrow shows__arrow--prev" onClick={prev} aria-label="Espetáculo anterior">←</button>
                  <button type="button" className="arrow shows__arrow shows__arrow--next" onClick={next} aria-label="Próximo espetáculo">→</button>
                </>
              )}
            </div>
            {shows.length > 1 && (
              <div className="shows__dots">
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
