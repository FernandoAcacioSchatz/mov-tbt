import { useContent } from './useContent';
import { todayBR } from '../utils/dates';
import type { SiteContent } from '../types/content';

/** Ano em que a Temporada começou (base para "{anos}"). */
export const FOUNDING_YEAR = 2005;

/**
 * Troca os marcadores automáticos dos textos editáveis:
 * {integrantes} = quantos integrantes estão cadastrados · {anos} = anos desde 2005 · {ano} = ano atual.
 */
export function fillPlaceholders(text: string, content: Pick<SiteContent, 'members'> | null, year = Number(todayBR().slice(0, 4))): string {
  return text
    .replace(/\{integrantes\}/gi, String(content?.members.length ?? 0))
    .replace(/\{anos\}/gi, String(year - FOUNDING_YEAR))
    .replace(/\{ano\}/gi, String(year));
}

/** Devolve uma função t("chave") para ler os textos editáveis do site (com os marcadores já trocados). */
export function useTexts(): (key: string) => string {
  const { content } = useContent();
  return (key: string) => fillPlaceholders(content?.texts[key] ?? '', content);
}
