import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminBar } from '../admin/AdminBar';
import { HistoryItemForm, NEW_LABEL, type HistoryRow } from '../admin/HistoryItemForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { deleteHistoryItem, fetchHistoryYears, fetchYearAll, HISTORY_TABLES, saveIntro } from '../services/historyService';
import { formatPreciseDate, todayBR } from '../utils/dates';
import { thumbUrl } from '../components/history/historyUtils';
import type { HistoryKind, HistoryYear } from '../types/content';

type YearData = Awaited<ReturnType<typeof fetchYearAll>>;
const KINDS: { kind: HistoryKind; label: string }[] = [
  { kind: 'postagens', label: 'Postagens' }, { kind: 'filipetas', label: 'Filipetas' }, { kind: 'clipagens', label: 'Clipagens' },
];

export function AdminHistoryPage() {
  useDocumentTitle('História (edição) — Movimento TBT');
  const thisYear = Number(todayBR().slice(0, 4));
  const allYears = Array.from({ length: thisYear - 2004 + 1 }, (_, i) => 2004 + i);
  const [year, setYear] = useState(thisYear);
  const [kind, setKind] = useState<HistoryKind>('postagens');
  const [counts, setCounts] = useState<HistoryYear[]>([]);
  const [loaded, setLoaded] = useState<{ year: number; data: YearData } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<HistoryRow | 'new' | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [introDrafts, setIntroDrafts] = useState<Record<string, string>>({});
  const [askLeave, setAskLeave] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([fetchHistoryYears(), fetchYearAll(year)])
      .then(([c, d]) => { if (active) { setCounts(c); setLoaded({ year, data: d }); } })
      .catch((e: unknown) => { if (active) setToast({ text: e instanceof Error ? e.message : 'Erro ao carregar.', ok: false }); });
    return () => { active = false; };
  }, [year, reloadKey]);
  const reload = () => setReloadKey((k) => k + 1);
  const changeYear = (y: number) => { setEditing(null); setConfirm(null); setYear(y); };

  const data = loaded?.year === year ? loaded.data : null;
  const introKey = `${year}-${kind}`;
  const intro = kind === 'postagens' ? '' : introDrafts[introKey] ?? data?.intros[kind] ?? '';
  const setIntro = (v: string) => setIntroDrafts((d) => ({ ...d, [introKey]: v }));

  // Abre direto no último ano com conteúdo, para não começar numa tela vazia.
  useEffect(() => {
    void fetchHistoryYears().then((c) => { const last = c.at(-1); if (last) setYear(last.year); }).catch(() => undefined);
  }, []);

  const rows: HistoryRow[] = !data ? [] : kind === 'postagens' ? data.posts : kind === 'filipetas' ? data.flyers : data.clippings;
  const count = (y: number) => { const c = counts.find((x) => x.year === y); return c ? c.postagens + c.filipetas + c.clipagens : 0; };

  const done = (savedYear: number, msg: string) => {
    setEditing(null); setToast({ text: msg, ok: true });
    if (savedYear !== year) changeYear(savedYear); else reload();
  };

  const remove = async (row: HistoryRow) => {
    try { await deleteHistoryItem(HISTORY_TABLES[kind], row.id); setToast({ text: 'Excluído.', ok: true }); setConfirm(null); reload(); }
    catch (e) { setToast({ text: e instanceof Error ? e.message : 'Não foi possível excluir.', ok: false }); }
  };

  const label = (r: HistoryRow) => ('title' in r ? r.title : r.caption) || '(sem legenda)';

  return (
    <>
      <AdminBar />
      <main id="conteudo" className="container page admin-history">
        <div className="admin-history__head">
          <h1 className="h2">História</h1>
          {/* volta para o painel da História no site, sem salvar o que estiver aberto */}
          {askLeave ? (
            <div className="ed-row__actions">
              <span className="ed-row__ask">Tem certeza que quer cancelar a edição? O que não foi salvo será perdido.</span>
              <button type="button" className="btn btn--magenta" onClick={() => navigate('/admin#historia')}>Sim, cancelar</button>
              <button type="button" className="btn btn--outline" onClick={() => setAskLeave(false)}>Continuar editando</button>
            </div>
          ) : (
            <button type="button" className="btn btn--outline" onClick={() => setAskLeave(true)}>Cancelar edição</button>
          )}
        </div>
        <p className="ed-hint" style={{ marginBottom: 'var(--space-5)' }}>
          Escolha o ano e o tipo. Tudo aparece no site em ordem cronológica, pela data do acontecimento — não é preciso ordenar nada.
          Datas aceitas: de 2004 até hoje.
        </p>
        {toast && <p role={toast.ok ? 'status' : 'alert'} className={toast.ok ? 'ed-toast' : 'ed-toast ed-toast--err'}>{toast.text}</p>}

        <div className="admin-history__bar">
          <div className="field">
            <label htmlFor="ah-year">Ano</label>
            <select id="ah-year" className="input" value={year} onChange={(e) => changeYear(Number(e.target.value))}>
              {allYears.slice().reverse().map((y) => <option key={y} value={y}>{y}{count(y) ? ` (${count(y)})` : ''}</option>)}
            </select>
          </div>
          <div className="ed-tabs" role="tablist" aria-label="Tipo">
            {KINDS.map((k) => (
              <button key={k.kind} type="button" role="tab" aria-selected={kind === k.kind} className="filter" aria-pressed={kind === k.kind}
                onClick={() => { setKind(k.kind); setEditing(null); setConfirm(null); }}>
                {k.label}{data ? ` · ${(k.kind === 'postagens' ? data.posts : k.kind === 'filipetas' ? data.flyers : data.clippings).length}` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="ed-card">
          <div className="ed-card__head">
            <div className="ed-card__title">{KINDS.find((k) => k.kind === kind)?.label} de {year}</div>
            <button type="button" className="btn btn--magenta" onClick={() => setEditing('new')}>+ {NEW_LABEL[kind]}</button>
          </div>

          {editing && (
            <HistoryItemForm key={editing === 'new' ? `new-${kind}-${year}` : editing.id} kind={kind} year={year}
              row={editing === 'new' ? undefined : editing} onDone={done} onCancel={() => setEditing(null)} />
          )}

          {kind !== 'postagens' && data && (
            <form className="field" onSubmit={(e) => { e.preventDefault(); void saveIntro(year, kind, intro).then(() => setToast({ text: 'Texto de abertura salvo.', ok: true })).catch((err: unknown) => setToast({ text: err instanceof Error ? err.message : 'Erro ao salvar.', ok: false })); }}>
              <label htmlFor="ah-intro">Texto de abertura das {kind} de {year} (opcional)</label>
              <textarea id="ah-intro" className="input" rows={4} value={intro} onChange={(e) => setIntro(e.target.value)} />
              <div><button type="submit" className="btn btn--outline btn--small">Salvar texto</button></div>
            </form>
          )}

          {!data ? <p className="status" role="status">Carregando…</p> : (
            <ul className="ed-list">
              {rows.length === 0 && <li className="empty">Nada cadastrado aqui em {year}.</li>}
              {rows.map((r) => (
                <li key={r.id} className="ed-row">
                  <div className="ed-row__date">{formatPreciseDate(r.event_date, r.date_precision)}</div>
                  {'image_url' in r && <img className="image-field__preview" src={thumbUrl(r.image_url)} alt="" loading="lazy" />}
                  <div className="ed-row__main">
                    <strong>{label(r)}</strong>
                    <span>{'group_name' in r ? [r.group_name, r.city].filter(Boolean).join(' · ') : 'newspaper' in r ? r.newspaper ?? '' : ''}</span>
                  </div>
                  {'published' in r && !r.published && <span className="chip ed-row__chip">Oculta</span>}
                  {confirm === r.id ? (
                    <div className="ed-row__actions">
                      <span className="ed-row__ask">Excluir mesmo?</span>
                      <button type="button" className="btn btn--magenta" onClick={() => void remove(r)}>Sim, excluir</button>
                      <button type="button" className="btn btn--outline" onClick={() => setConfirm(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <div className="ed-row__actions">
                      <button type="button" className="btn btn--yellow" aria-label={`Editar ${label(r)}`} onClick={() => setEditing(r)}>Editar</button>
                      <button type="button" className="btn btn--outline" aria-label={`Excluir ${label(r)}`} onClick={() => setConfirm(r.id)}>Excluir</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
