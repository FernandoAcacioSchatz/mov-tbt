import { Link } from 'react-router-dom';
import { useTexts } from '../hooks/useTexts';
import { useLoad } from '../hooks/useLoad';
import { EditButton } from '../components/ui/EditButton';
import { YearCard } from '../components/history/YearCard';
import { fetchHistoryYears } from '../services/historyService';
import { accentColor } from '../utils/format';

/** Seção "História" da página inicial: os anos da linha do tempo, cada um com a sua capa. */
export function Stories() {
  const t = useTexts();
  const years = useLoad(fetchHistoryYears, []);


  return (
    <section id="historia" className="section" aria-labelledby="historia-title">
      <EditButton section="historia" />
      <div className="container">
        <h2 id="historia-title" className="h2">{t('historiaTitle')}</h2>

        {years.data && years.data.length > 0 && (
          <div className="timeline-teaser">
            <p className="lead">Postagens, filipetas e clipagens de cada temporada, em ordem cronológica.</p>
            <ul className="years-grid years-grid--compact" aria-label="Anos da História">
              {years.data.map((y, i) => <li key={y.year}><YearCard year={y} color={accentColor(i)} /></li>)}
            </ul>
            <Link to="/historia" className="btn btn--outline">Ver toda a História →</Link>
          </div>
        )}

      </div>
    </section>
  );
}
