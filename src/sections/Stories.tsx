import { Link } from 'react-router-dom';
import { useTexts } from '../hooks/useTexts';
import { useLoad } from '../hooks/useLoad';
import { useContent } from '../hooks/useContent';
import { EditButton } from '../components/ui/EditButton';
import { YearCard } from '../components/history/YearCard';
import { fetchHistoryYears } from '../services/historyService';
import { accentClass } from '../utils/format';

/** Seção "História" da página inicial: os anos da linha do tempo, cada um com a sua capa. */
export function Stories() {
  const t = useTexts();
  const { content } = useContent();
  // os anos já vêm com o conteúdo do site (a seção aparece completa, sem empurrar a página ao chegar);
  // a busca própria só atualiza a lista depois, p.ex. ao voltar da edição da História no admin
  const fresh = useLoad(fetchHistoryYears, []);
  const years = fresh.data ?? content?.historyYears ?? [];

  return (
    <section id="historia" className="section" aria-labelledby="historia-title">
      <EditButton section="historia" />
      <div className="container">
        <h2 id="historia-title" className="h2">{t('historiaTitle')}</h2>

        {years.length > 0 && (
          <div className="timeline-teaser">
            <p className="lead">Postagens, filipetas e clipagens de cada temporada, em ordem cronológica.</p>
            <ul className="years-grid years-grid--compact" aria-label="Anos da História">
              {years.map((y, i) => <li key={y.year}><YearCard year={y} accent={accentClass(i)} /></li>)}
            </ul>
            <Link to="/historia" className="btn btn--outline">Ver toda a História →</Link>
          </div>
        )}

      </div>
    </section>
  );
}
