import { safeUrl } from '../../utils/url';

export const KIND_LABEL = { postagens: 'Postagens', filipetas: 'Filipetas', clipagens: 'Clipagens' } as const;

/** Ano vindo da URL: 4 dígitos, de 2004 em diante. */
export function parseYear(param: string | undefined): number | null {
  if (!param || !/^\d{4}$/.test(param)) return null;
  const y = Number(param);
  return y >= 2004 && y <= 2100 ? y : null;
}

/**
 * Miniatura: as imagens do acervo em /images/historia/ têm uma versão "-480.webp" ao lado.
 * Imagens enviadas pelo painel (Storage) não têm, então usamos a própria imagem.
 */
export function thumbUrl(src: string | null | undefined): string | undefined {
  const url = safeUrl(src);
  if (url && url.startsWith('/images/historia/') && url.endsWith('.webp') && !url.endsWith('-480.webp')) {
    return url.replace(/\.webp$/, '-480.webp');
  }
  return url;
}

/** Quebra o texto em parágrafos (linhas em branco separam parágrafos). */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
