import { useContent } from '../hooks/useContent';
import { useTexts } from '../hooks/useTexts';
import { EditButton } from '../components/ui/EditButton';
import { SafeLink } from '../components/ui/SafeLink';
import { accentColor } from '../utils/format';
import { safeUrl, youtubeId } from '../utils/url';

export function Media() {
  const { content } = useContent();
  const t = useTexts();
  const videos = content?.videos ?? [];
  const podcasts = content?.podcasts ?? [];
  const photos = content?.photos ?? [];

  return (
    <section id="midias" className="section" aria-labelledby="midias-title">
      <EditButton section="midias" />
      <div className="container">
        <h2 id="midias-title" className="h2">{t('midiasTitle')}</h2>

        {videos.length > 0 && (
          <>
            <h3 className="media__group-title">{t('videosTitle')}</h3>
            <div className="videos">
              {videos.map((v, i) => (
                <SafeLink key={v.id} href={v.href} className="video-card" aria-label={`Assistir: ${v.title}`}>
                  <div className="video-card__cover" style={{ background: accentColor(i) }}>
                    {(() => {
                      const yt = youtubeId(v.href);
                      const cover = safeUrl(v.cover_url) ?? (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined);
                      return cover ? <img className="video-card__img" src={cover} alt="" loading="lazy" /> : null;
                    })()}
                    <div className="video-card__play">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbf8f1" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="video-card__body">
                    <div className="video-card__title">{v.title}</div>
                    {v.who && <div className="video-card__who">{v.who}</div>}
                  </div>
                </SafeLink>
              ))}
            </div>
          </>
        )}

        {podcasts.length > 0 && (
          <>
            <h3 className="media__group-title">{t('podcastsTitle')}</h3>
            <div className="podcasts">
              {podcasts.map((p, i) => (
                <SafeLink key={p.id} href={p.href || t('socSpotify')} className="podcast">
                  <span className="podcast__n" style={{ background: accentColor(i) }}>{p.n}</span>
                  <span className="podcast__title">{p.title}</span>
                  <span className="podcast__cta">Ouvir ↗</span>
                </SafeLink>
              ))}
            </div>
          </>
        )}

        {photos.length > 0 && (
          <>
            <h3 className="media__group-title">{t('fotosTitle')}</h3>
            <div className="photos">
              {photos.map((ph, i) => {
                const src = safeUrl(ph.src);
                return (
                  <figure key={ph.id} className="photo">
                    <div style={{ background: accentColor(i) }}>
                      {src && <img src={src} alt={ph.caption} loading="lazy" />}
                    </div>
                    <figcaption><strong>{ph.caption}</strong><br /><span>{ph.taken_when}</span></figcaption>
                  </figure>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
