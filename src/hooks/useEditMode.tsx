import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type SectionKey = 'inicio' | 'sobre' | 'agenda' | 'historia' | 'namidia' | 'midias' | 'integrantes' | 'contato' | 'rodape';

interface EditState {
  /** true na rota /admin: mostra os botões “Editar”. */
  enabled: boolean;
  active: SectionKey | null;
  open: (key: SectionKey) => void;
  close: () => void;
}

const EditContext = createContext<EditState>({ enabled: false, active: null, open: () => undefined, close: () => undefined });

export function EditModeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [active, setActive] = useState<SectionKey | null>(null);
  const open = useCallback((key: SectionKey) => setActive(key), []);
  const close = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ enabled, active: enabled ? active : null, open, close }), [enabled, active, open, close]);
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEditMode(): EditState {
  return useContext(EditContext);
}
