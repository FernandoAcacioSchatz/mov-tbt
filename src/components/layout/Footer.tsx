import { Link } from 'react-router-dom';
import { useTexts } from '../../hooks/useTexts';
import { EditButton } from '../ui/EditButton';
import { todayBR } from '../../utils/dates';
import { safeUrl } from '../../utils/url';
import { SOCIALS } from '../../assets/socials';

export function Footer({ adminMode = false }: { adminMode?: boolean }) {
  const t = useTexts();
  return (
    <footer className="footer" style={{ position: 'relative' }}>
      <EditButton section="rodape" />
      <div className="footer__inner">
        {/* "© AAAA" sempre com o ano atual, sem precisar editar o texto todo ano */}
        <div>{t('footer').replace(/©\s*\d{4}/, `© ${todayBR().slice(0, 4)}`)}</div>
        <div className="footer__links">
          <Link to="/privacidade">Política de Privacidade</Link>
          {adminMode && <Link to="/">← Voltar ao site</Link>}
        </div>
        {/* logos das redes (links editáveis em Editar → Contato); some a que estiver sem link */}
        <div className="footer__socials">
          {SOCIALS.map(({ label, key, color, path }) => {
            const url = safeUrl(t(key));
            return url && (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="footer__social" style={{ ['--social' as string]: color }} aria-label={`${label} (abre em nova aba)`} title={label}>
                {/* só o ícone, sem fundo: ganha a cor da rede ao passar o mouse */}
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d={path} fill="currentColor" /></svg>
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
