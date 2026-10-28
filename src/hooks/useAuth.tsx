import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as auth from '../services/authService';

interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async (next: Session | null) => {
    setSession(next);
    setIsAdmin(next ? await auth.checkIsAdmin() : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void auth.getSession().then((s) => { if (active) void resolve(s); });
    const off = auth.onAuthChange((s) => {
      // adia a chamada para fora do callback do Supabase (evita deadlock interno)
      setTimeout(() => { if (active) void resolve(s); }, 0);
    });
    return () => { active = false; off(); };
  }, [resolve]);

  const signIn = useCallback(async (email: string, password: string) => {
    await auth.signIn(email, password);
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
  }, []);

  const value = useMemo(() => ({ session, isAdmin, loading, signIn, signOut }), [session, isAdmin, loading, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return ctx;
}
