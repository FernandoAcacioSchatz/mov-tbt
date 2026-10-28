import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEditMode, type SectionKey } from '../hooks/useEditMode';
import { RESOURCES, SECTIONS } from './config';
import { TextFieldsEditor } from './TextFieldsEditor';
import { ResourceEditor } from './ResourceEditor';

/** Painel que se abre acima da seção quando se clica em “Editar”. */
export function SectionEditor({ section }: { section: SectionKey }) {
  const { active } = useEditMode();
  return active === section ? <Panel section={section} /> : null;
}

function Panel({ section }: { section: SectionKey }) {
  const { close } = useEditMode();
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const def = SECTIONS[section];

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ref.current?.focus({ preventScroll: true });
  }, []);

  const onMessage = (text: string, ok: boolean) => setToast({ text, ok });
  const res = def.resources[tab];

  return (
    <div className="ed-panel" ref={ref} tabIndex={-1} role="region" aria-label={`Editando ${def.title}`}>
      <div className="container ed-panel__inner">
        <div className="ed-panel__head">
          <div>
            <div className="ed-panel__kicker">Editando esta seção</div>
            <h2 className="ed-panel__title">{def.title}</h2>
          </div>
          <button type="button" className="btn btn--yellow btn--lg" onClick={close}>Concluir ✓</button>
        </div>
        {toast && <div role={toast.ok ? 'status' : 'alert'} className={toast.ok ? 'ed-toast' : 'ed-toast ed-toast--err'}>{toast.text}</div>}
        <TextFieldsEditor fields={def.texts} onMessage={onMessage} />
        {section === 'historia' && (
          <div className="ed-card"><Link className="btn btn--outline" to="/admin/historia">Abrir editor da História (postagens, filipetas e clipagens por ano) →</Link></div>
        )}
        {section === 'contato' && (
          <div className="ed-card"><Link className="btn btn--outline" to="/admin/mensagens">Abrir caixa de mensagens recebidas →</Link></div>
        )}
        {def.resources.length > 1 && (
          <div className="ed-tabs" role="tablist" aria-label="Tipo de item">
            {def.resources.map((r, i) => (
              <button key={r} type="button" role="tab" aria-selected={tab === i} className="filter" aria-pressed={tab === i} onClick={() => setTab(i)}>{RESOURCES[r].label}</button>
            ))}
          </div>
        )}
        {res && <ResourceEditor key={res} def={RESOURCES[res]} onMessage={onMessage} />}
      </div>
    </div>
  );
}
