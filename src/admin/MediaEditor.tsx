import { useState } from 'react';
import { HistoryItemForm } from './HistoryItemForm';
import { useLoad } from '../hooks/useLoad';
import { deleteHistoryItem, fetchMedia, HISTORY_TABLES, MEDIA_CHANGED } from '../services/historyService';
import { MEDIA_TYPE_LABEL, mediaCover } from '../components/history/historyUtils';
import { formatPreciseDate, todayBR } from '../utils/dates';
import type { HistoryMedia } from '../types/content';

/** Lista de Mídias no painel de edição: criar, editar e excluir. Cada item também aparece na História do seu ano. */
export function MediaEditor({ onMessage }: { onMessage: (text: string, ok: boolean) => void }) {
  const [reloadKey, setReloadKey] = useState(0);
  const res = useLoad(() => fetchMedia(), [reloadKey]);
  const [editing, setEditing] = useState<HistoryMedia | 'new' | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const thisYear = Number(todayBR().slice(0, 4));

  const changed = (msg: string) => {
    setEditing(null); setConfirm(null); onMessage(msg, true);
    setReloadKey((k) => k + 1);
    window.dispatchEvent(new Event(MEDIA_CHANGED));
  };

  const remove = async (m: HistoryMedia) => {
    try { await deleteHistoryItem(HISTORY_TABLES.midia, m.id); changed('Excluída de Mídias e da História.'); }
    catch (e) { onMessage(e instanceof Error ? e.message : 'Não foi possível excluir.', false); }
  };

  return (
    <div className="ed-card">
      <div className="ed-card__head">
        <div className="ed-card__title">Postagens na mídia</div>
        <button type="button" className="btn btn--magenta" onClick={() => setEditing('new')}>+ Nova postagem</button>
      </div>
      <p className="ed-hint">
        Matérias, entrevistas, vídeos, fotos e posts sobre a TBT. Tudo o que for cadastrado aqui também aparece na História, no ano da data informada
        (categoria “Na mídia”). As mais recentes aparecem primeiro.
      </p>

      {editing && (
        <HistoryItemForm key={editing === 'new' ? 'new-midia' : editing.id} kind="midia"
          year={editing === 'new' ? thisYear : Number(editing.event_date.slice(0, 4))}
          row={editing === 'new' ? undefined : editing}
          onDone={(_, msg) => changed(msg)} onCancel={() => setEditing(null)} />
      )}

      {res.loading ? <p className="status" role="status">Carregando…</p> : res.error ? <p className="ed-toast ed-toast--err" role="alert">{res.error}</p> : (
        <ul className="ed-list">
          {res.data?.length === 0 && <li className="empty">Nenhuma postagem ainda. Clique em “+ Nova postagem”.</li>}
          {res.data?.map((m) => (
            <li key={m.id} className="ed-row">
              <div className="ed-row__date">{formatPreciseDate(m.event_date, m.date_precision)}</div>
              {mediaCover(m) && <img className="image-field__preview" src={mediaCover(m)} alt="" loading="lazy" />}
              <div className="ed-row__main">
                <strong>{m.title}</strong>
                <span>{[MEDIA_TYPE_LABEL[m.media_type], m.outlet].filter(Boolean).join(' · ')}</span>
              </div>
              {!m.published && <span className="chip ed-row__chip">Oculta</span>}
              {confirm === m.id ? (
                <div className="ed-row__actions">
                  <span className="ed-row__ask">Excluir mesmo? Sai também da História.</span>
                  <button type="button" className="btn btn--magenta" onClick={() => void remove(m)}>Sim, excluir</button>
                  <button type="button" className="btn btn--outline" onClick={() => setConfirm(null)}>Cancelar</button>
                </div>
              ) : (
                <div className="ed-row__actions">
                  <button type="button" className="btn btn--yellow" aria-label={`Editar ${m.title}`} onClick={() => setEditing(m)}>Editar</button>
                  <button type="button" className="btn btn--outline" aria-label={`Excluir ${m.title}`} onClick={() => setConfirm(m.id)}>Excluir</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
