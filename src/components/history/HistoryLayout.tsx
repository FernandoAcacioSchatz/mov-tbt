import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { YearBar } from './YearBar';
import { useLoad } from '../../hooks/useLoad';
import { fetchHistoryYears } from '../../services/historyService';

export interface Crumb { label: string; to?: string }

/** Moldura das páginas da História: cabeçalho, trilha (onde estou), barra de anos e rodapé. */
export function HistoryLayout({ crumbs, year, children }: { crumbs: Crumb[]; year?: number; children: ReactNode }) {
  const years = useLoad(fetchHistoryYears, []);
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo" className="history">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <ol>
              <li><Link to="/">Início</Link></li>
              {crumbs.map((c) => (
                <li key={c.label}>{c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
          {years.data && <YearBar years={years.data} current={year} />}
        </div>
        {children}
      </main>
      <Footer />
    </>
  );
}

export function LoadingOrError({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <p className="status" role="status">Carregando…</p>;
  if (error) return <p className="status" role="alert">{error}</p>;
  return null;
}
