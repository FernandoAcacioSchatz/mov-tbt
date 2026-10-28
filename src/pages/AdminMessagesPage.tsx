import { useCallback, useEffect, useState } from 'react';
import { AdminBar } from '../admin/AdminBar';
import { deleteMessage, listMessages, markMessageRead } from '../services/contactService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { ContactMessage } from '../types/content';

export function AdminMessagesPage() {
  useDocumentTitle('Mensagens — Movimento TBT');
  const [items, setItems] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems(await listMessages()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar.'); }
  }, []);
  useEffect(() => {
    let active = true;
    listMessages()
      .then((r) => { if (active) { setItems(r); setError(null); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar.'); });
    return () => { active = false; };
  }, []);

  const act = async (fn: () => Promise<void>) => {
    try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Ação não concluída.'); }
  };

  return (
    <>
      <AdminBar />
      <main id="conteudo" className="container page">
        <h1 className="h2" style={{ marginBottom: 'var(--space-5)' }}>Mensagens recebidas</h1>
        <p className="ed-hint" style={{ marginBottom: 'var(--space-5)' }}>Por enquanto as mensagens chegam apenas aqui. O aviso por e-mail e WhatsApp será adicionado depois.</p>
        {error && <p className="form__error" role="alert">{error}</p>}
        {items === null && !error && <p className="status" role="status">Carregando…</p>}
        {items?.length === 0 && <p className="empty">Nenhuma mensagem ainda.</p>}
        {items?.map((m) => (
          <article key={m.id} className={m.read ? 'msg' : 'msg msg--unread'}>
            <div className="msg__meta">{new Date(m.created_at).toLocaleString('pt-BR')} · {m.subject}{m.read ? '' : ' · NOVA'}</div>
            <strong>{m.name}</strong> — <a href={`mailto:${encodeURIComponent(m.email)}`}>{m.email}</a>
            <p className="msg__body">{m.message}</p>
            <div className="ed-actions">
              <button type="button" className="btn btn--yellow btn--small" onClick={() => void act(() => markMessageRead(m.id, !m.read))}>{m.read ? 'Marcar como não lida' : 'Marcar como lida'}</button>
              <button type="button" className="btn btn--outline btn--small" onClick={() => { if (window.confirm('Excluir esta mensagem?')) void act(() => deleteMessage(m.id)); }}>Excluir</button>
            </div>
          </article>
        ))}
      </main>
    </>
  );
}
