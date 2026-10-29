import { useTexts } from '../hooks/useTexts';
import { EditButton } from '../components/ui/EditButton';
import { accentColor } from '../utils/format';
import { paragraphs } from '../components/history/historyUtils';

export function About() {
  const t = useTexts();
  // Destaques deixados em branco pelo admin somem (sem sobrar o fundo colorido vazio).
  const stats = [1, 2, 3, 4]
    .map((n) => ({ n, value: t(`stat${n}v`).trim(), label: t(`stat${n}l`).trim() }))
    .filter((s) => s.value || s.label);
  // os dois campos de texto podem ter vários parágrafos: o primeiro vira o destaque, o resto vem em seguida
  const [lead, ...rest] = [...paragraphs(t('sobreP1')), ...paragraphs(t('sobreP2'))];
  return (
    <section id="sobre" className="section" aria-labelledby="sobre-title">
      <EditButton section="sobre" />
      <div className="container about">
        <h2 id="sobre-title" className="h2">{t('sobreTitle')}</h2>
        {lead && <p className="about__lead pre-line">{lead}</p>}
        {rest.map((p, i) => <p key={i} className="about__p pre-line">{p}</p>)}
        {stats.length > 0 && (
          // destaques em forma de ingresso de teatro: canhoto picotado com o número e o corpo com o valor
          <ul className="stats" aria-label="Destaques">
            {stats.map((s, i) => (
              <li key={s.n} className="stat" style={{ ['--ticket' as string]: accentColor(i) }}>
                <span className="stat__ticket">
                  <span className="stat__stub" aria-hidden="true">Nº {String(i + 1).padStart(2, '0')}</span>
                  <span className="stat__body">
                    {s.value && <span className="stat__value">{s.value}</span>}
                    {s.label && <span className="stat__label">{s.label}</span>}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
