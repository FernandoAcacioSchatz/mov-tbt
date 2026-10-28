import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/** Barreira de navegação. A segurança real está nas regras do banco; isto só evita telas vazias. */
export function RequireAdmin() {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <p className="status" role="status">Verificando acesso…</p>;
  if (!session || !isAdmin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
