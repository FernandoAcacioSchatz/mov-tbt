import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOGO_MASKS } from '../../assets/brand';
import { onSectionLinkClick } from '../../utils/scroll';
import { safeUrl } from '../../utils/url';
import { useContent } from '../../hooks/useContent';
import { useTexts } from '../../hooks/useTexts';

const MENU = [
  ['Agenda', 'agenda'], ['Sobre', 'sobre'], ['História', 'historia'],
  ['Mídias', 'midias'], ['Integrantes', 'integrantes'], ['Contato', 'contato'],
] as const;

export function Header({ base = '' }: { base?: string }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { content } = useContent();
  const t = useTexts();
  // Logo trocada pelo admin (Editar → Início); sem ela, a original do site.
  const customLogo = safeUrl(content?.texts.logoTopo, { httpsOnly: true });
  // Nas páginas sem as seções (ex.: /privacidade) os links levam de volta à página inicial.
  const onHome = pathname === (base || '/') || pathname === `${base}/`;
  const to = (id: string) => (onHome ? `#${id}` : `${base}/#${id}`);

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to={`${base}/#inicio`} className="header__logo" aria-label="Movimento TBT — início">
          {customLogo
            ? <img src={customLogo} alt="Logo Movimento Temporada Blumenauense de Teatro" height={LOGO_MASKS.height} />
            : <img src={LOGO_MASKS.src} srcSet={LOGO_MASKS.srcSet} alt="Logo Movimento Temporada Blumenauense de Teatro" width={LOGO_MASKS.width} height={LOGO_MASKS.height} />}
        </Link>
        <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="menu-principal" onClick={() => setOpen((o) => !o)}>
          {open ? 'Fechar' : 'Menu'}
        </button>
        <nav id="menu-principal" className="nav" aria-label="Principal" data-open={open}>
          {MENU.map(([label, id]) => (
            onHome
              ? <a key={id} href={to(id)} onClick={(e) => { setOpen(false); onSectionLinkClick(e, id); }}>{label}</a>
              : <Link key={id} to={to(id)} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
        {/* botões que ficavam abaixo do título do Início (textos editáveis em Editar → Início) */}
        <div className="header__cta">
          {([['heroBtn1', 'agenda', 'btn--yellow'], ['heroBtn2', 'historia', 'btn--outline']] as const).map(([key, id, style]) => (
            onHome
              ? <a key={key} className={`btn ${style}`} href={to(id)} onClick={(e) => onSectionLinkClick(e, id)}>{t(key)}</a>
              : <Link key={key} className={`btn ${style}`} to={to(id)}>{t(key)}</Link>
          ))}
        </div>
      </div>
    </header>
  );
}
