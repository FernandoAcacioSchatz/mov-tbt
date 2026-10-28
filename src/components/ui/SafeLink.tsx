import type { ReactNode } from 'react';
import { safeUrl } from '../../utils/url';

interface Props { href: string | null | undefined; className?: string; children: ReactNode; style?: React.CSSProperties; 'aria-label'?: string }

/** Link externo: só aceita http/https e abre com rel seguro. Se o endereço for inválido, não renderiza link. */
export function SafeLink({ href, children, ...rest }: Props) {
  const url = safeUrl(href);
  if (!url) return <span className={rest.className}>{children}</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}
