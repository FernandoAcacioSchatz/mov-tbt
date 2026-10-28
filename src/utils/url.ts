/** Caminho de arquivo do próprio site (pasta public/images), ex.: "/images/acervo/foto.webp". */
export const LOCAL_IMAGE_RE = /^\/images\/[\w./-]+$/;

/** Id de um vídeo do YouTube a partir do link (watch?v=, youtu.be/, shorts/, embed/). */
export function youtubeId(href: string | null | undefined): string | null {
  const url = safeUrl(href);
  if (!url) return null;
  const u = new URL(url);
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com') id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

/**
 * Só deixa passar endereços http(s) ou imagens do próprio site (/images/…). Bloqueia `javascript:`,
 * `data:` e similares, mesmo que algum dado malicioso chegue ao banco.
 */
export function safeUrl(value: string | null | undefined, opts: { httpsOnly?: boolean } = {}): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (LOCAL_IMAGE_RE.test(v) && !v.includes('..')) return v;
  try {
    const url = new URL(v);
    const allowed = opts.httpsOnly ? ['https:'] : ['https:', 'http:'];
    return allowed.includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
