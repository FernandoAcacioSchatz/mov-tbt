import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Agenda } from '../sections/Agenda';
import { Stories } from '../sections/Stories';
import { InTheMedia } from '../sections/InTheMedia';
import { Media } from '../sections/Media';
import { Cast } from '../sections/Cast';
import { Contact } from '../sections/Contact';
import { EditModeProvider, type SectionKey } from '../hooks/useEditMode';
import { useContent } from '../hooks/useContent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { scrollToSection } from '../utils/scroll';

// Código do painel de edição só é baixado em /admin.
const AdminBar = lazy(() => import('../admin/AdminBar').then((m) => ({ default: m.AdminBar })));
const LazySectionEditor = lazy(() => import('../admin/SectionEditor').then((m) => ({ default: m.SectionEditor })));

function SectionEditor({ section, admin }: { section: SectionKey; admin: boolean }) {
  if (!admin) return null;
  return <Suspense fallback={null}><LazySectionEditor section={section} /></Suspense>;
}

export function HomePage({ admin = false }: { admin?: boolean }) {
  const { loading, error, reload } = useContent();
  const { hash } = useLocation();
  useDocumentTitle(admin ? 'Modo edição — Movimento TBT' : 'Movimento TBT — Temporada Blumenauense de Teatro');

  useEffect(() => {
    if (!loading && hash) scrollToSection(hash.slice(1));
  }, [loading, hash]);

  return (
    <EditModeProvider enabled={admin}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      {admin && <Suspense fallback={null}><AdminBar /></Suspense>}
      <Header base={admin ? '/admin' : ''} />
      <main id="conteudo" className={admin ? 'admin-on' : undefined}>
        {loading && <p className="status" role="status">Carregando…</p>}
        {error && !loading && (
          <div className="status" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn--magenta" onClick={() => void reload()}>Tentar de novo</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <SectionEditor section="inicio" admin={admin} />
            <Hero />
            <SectionEditor section="sobre" admin={admin} />
            <About />
            <SectionEditor section="agenda" admin={admin} />
            <Agenda />
            <SectionEditor section="historia" admin={admin} />
            <Stories />
            <SectionEditor section="namidia" admin={admin} />
            <InTheMedia />
            <SectionEditor section="midias" admin={admin} />
            <Media />
            <SectionEditor section="integrantes" admin={admin} />
            <Cast />
            <SectionEditor section="contato" admin={admin} />
            <Contact />
          </>
        )}
      </main>
      <SectionEditor section="rodape" admin={admin} />
      <Footer adminMode={admin} />
    </EditModeProvider>
  );
}
