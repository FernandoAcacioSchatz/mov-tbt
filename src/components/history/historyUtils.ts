import { safeUrl, youtubeId } from '../../utils/url';
import type { HistoryMedia, MediaType } from '../../types/content';

export const KIND_LABEL = { postagens: 'Postagens', filipetas: 'Filipetas', clipagens: 'Clipagens', midia: 'Na mídia' } as const;

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  materia: 'Matéria', video: 'Vídeo', foto: 'Fotos', postagem: 'Postagem', link: 'Link',
};

/** Capa de um item na mídia: a imagem escolhida, senão a do YouTube, senão a 1ª foto. */
export function mediaCover(m: Pick<HistoryMedia, 'image_url' | 'video_url' | 'photos'>): string | undefined {
  const yt = youtubeId(m.video_url);
  return thumbUrl(m.image_url) ?? (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined) ?? thumbUrl(m.photos[0]);
}

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
