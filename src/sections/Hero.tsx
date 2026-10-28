import { useTexts } from '../hooks/useTexts';
import { EditButton } from '../components/ui/EditButton';
import { safeUrl } from '../utils/url';
import { useContent } from '../hooks/useContent';
import { useFitText } from '../hooks/useFitText';

// Fotos padrão da faixa; cada uma pode ser trocada pelo admin (Editar → Início).
const PHOTOS = [
  { key: 'heroFoto1', src: '/images/historia/2014/postagens/foto-6316.webp' },
  { key: 'heroFoto2', src: '/images/historia/2013/postagens/os-bestas-do-apocalipse-9.webp' },
  { key: 'heroFoto3', src: '/images/acervo/isso-nao-e-brincadeira-detalhe.webp' },
  { key: 'heroFoto4', src: '/images/historia/2014/postagens/o-traje-da-rainha-6536.webp' },
  { key: 'heroFoto5', src: '/images/historia/2013/postagens/mg-6658-2.webp' },
];

export function Hero() {
  const t = useTexts();
  const { content } = useContent();
  const line1 = t('heroLine1');
  const line2 = t('heroLine2');
  // palavra grande encolhe a fonte em vez de quebrar no meio
  const titleRef = useFitText([line1, line2]);
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <EditButton section="inicio" />
      <div className="container hero__inner">
        <div className="hero__heading">
          {/* desenho das máscaras da logo, atrás do título */}
          <img className="hero__masks" src="/images/mascaras.webp" alt="" width={640} height={605} aria-hidden="true" />
          <h1 id="hero-title" className="hero__title" ref={titleRef}>
            <span className="hero__line">{line1}</span>{' '}
            <span className="hero__line hero__line--outline">{line2}</span>
          </h1>
        </div>
      </div>
      {/* fotos decorativas espalhadas, como polaroides */}
      <div className="hero__photos" aria-hidden="true">
        {PHOTOS.map((p) => (
          <div key={p.key} className="hero__photo">
            <img src={safeUrl(content?.texts[p.key], { httpsOnly: true }) || p.src} alt="" width={400} height={400} />
          </div>
        ))}
      </div>
    </section>
  );
}
