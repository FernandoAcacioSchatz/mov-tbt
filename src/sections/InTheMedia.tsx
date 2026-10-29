import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTexts } from '../hooks/useTexts';
import { useLoad } from '../hooks/useLoad';
import { EditButton } from '../components/ui/EditButton';
import { MediaCard } from '../components/media/MediaCard';
import { MediaEmpty } from '../components/media/MediaEmpty';
import { fetchMedia, MEDIA_CHANGED } from '../services/historyService';
import { accentColor } from '../utils/format';

/** Na página inicial: as mais recentes; o resto fica em /midias. */
export const HOME_MEDIA_LIMIT = 6;

/** Seção "Mídias": a TBT na imprensa, na TV e nas redes. Os itens também entram na História, no ano de cada um. */
export function InTheMedia() {
  const t = useTexts();
  // o painel avisa quando algo é cadastrado, editado ou excluído
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    const bump = () => setReloadKey((k) => k + 1);
    window.addEventListener(MEDIA_CHANGED, bump);
    return () => window.removeEventListener(MEDIA_CHANGED, bump);
  }, []);
  const res = useLoad(() => fetchMedia(HOME_MEDIA_LIMIT * 2), [reloadKey]);
  // logado como admin, o banco devolve também as ocultas: aqui, como no site público, só as publicadas
  const items = (res.data ?? []).filter((m) => m.published);

  return (
    <section id="na-midia" className="section" aria-labelledby="na-midia-title">
      <EditButton section="namidia" />
      <div className="container">
        <h2 id="na-midia-title" className="h2">{t('namidiaTitle') || 'Mídias'}</h2>
        <p className="lead" style={{ maxWidth: '38.75rem', marginBottom: 'var(--space-6)' }}>
          {t('namidiaText') || 'A TBT nos jornais, na TV, nos sites e nas redes: matérias, entrevistas, vídeos e postagens sobre o movimento.'}
        </p>
        {/* sem nada publicado (ou se a busca falhar), um card de "em breve" no lugar do espaço vazio */}
        {!res.loading && items.length === 0 && <MediaEmpty />}
        {items.length > 0 && (
          <>
            <ul className="media-grid" aria-label="TBT na mídia">
              {items.slice(0, HOME_MEDIA_LIMIT).map((m, i) => <li key={m.id}><MediaCard item={m} color={accentColor(i)} /></li>)}
            </ul>
            <Link to="/midias" className="btn btn--outline media-grid__more">Ver todas as mídias →</Link>
          </>
        )}
      </div>
    </section>
  );
}
