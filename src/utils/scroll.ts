import { prefersReducedMotion } from '../hooks/useScrollCarousel';

/** Folga acima do título quando a seção é mais alta que a tela (não dá para centralizar). */
const TALL_OFFSET = 24;

/** Seções que ficam no alto da página em vez de centralizadas. */
const TOP_SECTIONS = new Set(['inicio']);

/** Posição de rolagem que deixa a seção centralizada (ou com o topo visível, se não couber). */
function targetY(el: HTMLElement): number {
  if (TOP_SECTIONS.has(el.id)) return 0; // "Início" volta ao topo da página
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const offset = r.height <= vh ? (vh - r.height) / 2 : TALL_OFFSET;
  const max = document.documentElement.scrollHeight - vh;
  return Math.max(0, Math.min(max, window.scrollY + r.top - offset));
}

let pending: number[] = [];
function cancelCorrections() { pending.forEach((t) => window.clearTimeout(t)); pending = []; }

/**
 * Rola até uma seção deixando-a centralizada na tela.
 * Se imagens ou conteúdo carregarem durante a rolagem e empurrarem a seção, corrige a posição
 * (a correção é cancelada se a pessoa rolar a página por conta própria).
 * Devolve false se a seção não existir na página.
 */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  cancelCorrections();
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
  window.scrollTo({ top: targetY(el), behavior });

  const stop = () => { cancelCorrections(); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop); };
  window.addEventListener('wheel', stop, { passive: true, once: true });
  window.addEventListener('touchstart', stop, { passive: true, once: true });
  window.addEventListener('keydown', stop, { once: true });
  for (const delay of [700, 1400, 2400]) {
    pending.push(window.setTimeout(() => {
      const y = targetY(el);
      if (Math.abs(y - window.scrollY) > 8) window.scrollTo({ top: y, behavior });
    }, delay));
  }
  pending.push(window.setTimeout(stop, 2500));
  return true;
}

/** Para links "#secao": rola centralizado e atualiza o endereço sem pular. */
export function onSectionLinkClick(e: React.MouseEvent<HTMLAnchorElement>, id: string): void {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (scrollToSection(id)) {
    e.preventDefault();
    window.history.replaceState(null, '', `#${id}`);
  }
}
