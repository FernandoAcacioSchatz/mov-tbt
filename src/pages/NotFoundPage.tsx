import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página não encontrada — Movimento TBT');
  return (
    <main id="conteudo" className="container page">
      <h1 className="h2">Página não encontrada</h1>
      <p className="lead" style={{ marginBlock: 'var(--space-4)' }}>O endereço que você abriu não existe.</p>
      <Link className="btn btn--magenta" to="/">Voltar ao início</Link>
    </main>
  );
}
