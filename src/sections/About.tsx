import { useTexts } from '../hooks/useTexts';
import { EditButton } from '../components/ui/EditButton';
import { accentColor } from '../utils/format';

export function About() {
  const t = useTexts();
  // Destaques deixados em branco pelo admin somem (sem sobrar o fundo colorido vazio).
  const stats = [1, 2, 3, 4]
    .map((n) => ({ n, value: t(`stat${n}v`).trim(), label: t(`stat${n}l`).trim() }))
    .filter((s) => s.value || s.label);
  return (
    <section id="sobre" className="section" aria-labelledby="sobre-title">
      <EditButton section="sobre" />
      <div className="container about">
        <div className="about__left">
          <h2 id="sobre-title" className="h2">{t('sobreTitle')}</h2>
          {stats.length > 0 && (
            <div className="stats">
              {stats.map((s, i) => (
                <div key={s.n}>
                  {s.value && <div className="stat__value" style={{ background: accentColor(i) }}>{s.value}</div>}
                  {s.label && <div className="stat__label">{s.label}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="about__right lead">
          <p className="pre-line">{t('sobreP1')}</p>
          <p className="pre-line">{t('sobreP2')}</p>
        </div>
      </div>
    </section>
  );
}
