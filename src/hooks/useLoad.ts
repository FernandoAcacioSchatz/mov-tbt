import { useEffect, useState, type DependencyList } from 'react';

interface LoadState<T> { data: T | null; loading: boolean; error: string | null }

/**
 * Carrega dados assíncronos com estados de carregando/erro e ignora respostas antigas
 * (se as dependências mudarem no meio do caminho ou o componente sair).
 */
export function useLoad<T>(fn: () => Promise<T>, deps: DependencyList): LoadState<T> {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
  useEffect(() => {
    let active = true;
    fn()
      .then((data) => { if (active) setState({ key, data, error: null }); })
      .catch((e: unknown) => { if (active) setState({ key, data: null, error: e instanceof Error ? e.message : 'Não foi possível carregar.' }); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const fresh = state.key === key;
  return { data: fresh ? state.data : null, loading: !fresh, error: fresh ? state.error : null };
}
