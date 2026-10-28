import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchSiteContent } from '../services/contentService';
import type { SiteContent } from '../types/content';

interface ContentState {
  content: SiteContent | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const ContentContext = createContext<ContentState | null>(null);

export function ContentProvider({ children, initial }: { children: ReactNode; initial?: SiteContent }) {
  const [content, setContent] = useState<SiteContent | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setContent(await fetchSiteContent());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o conteúdo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initial) return undefined;
    let active = true;
    fetchSiteContent()
      .then((c) => { if (active) { setContent(c); setError(null); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar o conteúdo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initial]);

  const value = useMemo(() => ({ content, loading, error, reload }), [content, loading, error, reload]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent precisa estar dentro de ContentProvider.');
  return ctx;
}
