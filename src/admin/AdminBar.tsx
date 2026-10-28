import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AdminBar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="adminbar">
      <div className="container adminbar__inner">
        <strong>Modo edição</strong>
        <span className="adminbar__user">{session?.user.email}</span>
        <nav aria-label="Administração" className="adminbar__nav">
          <Link to="/admin">Site</Link>
          <Link to="/admin/historia">História</Link>
          <Link to="/admin/mensagens">Mensagens</Link>
          <Link to="/admin/administradores">Administradores</Link>
          <button type="button" onClick={() => void signOut().then(() => navigate('/login'))}>Sair</button>
        </nav>
      </div>
    </div>
  );
}
