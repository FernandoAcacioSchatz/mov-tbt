import { supabase } from './supabaseClient';
import { friendlyError, ServiceError } from './errors';
import type {
  Member, Photo, Podcast, ResourceTable, Show, SiteContent, SiteTexts, Video,
} from '../types/content';

const ORDER: Record<ResourceTable, { column: string; ascending: boolean }> = {
  shows: { column: 'date', ascending: true },
  members: { column: 'position', ascending: true },
  videos: { column: 'position', ascending: true },
  podcasts: { column: 'position', ascending: true },
  photos: { column: 'position', ascending: true },
};

async function selectAll<T>(table: ResourceTable): Promise<T[]> {
  const { column, ascending } = ORDER[table];
  const { data, error } = await supabase.from(table).select('*').order(column, { ascending });
  if (error) throw friendlyError(error, 'Não foi possível carregar o conteúdo.');
  return (data ?? []) as T[];
}

/** Carrega todo o conteúdo público do site. */
export async function fetchSiteContent(): Promise<SiteContent> {
  const [textRows, shows, members, videos, podcasts, photos] = await Promise.all([
    supabase.from('site_content').select('key,value'),
    selectAll<Show>('shows'),
    selectAll<Member>('members'),
    selectAll<Video>('videos'),
    selectAll<Podcast>('podcasts'),
    selectAll<Photo>('photos'),
  ]);
  if (textRows.error) throw friendlyError(textRows.error, 'Não foi possível carregar os textos.');
  const texts: SiteTexts = {};
  for (const row of textRows.data ?? []) texts[row.key as string] = row.value as string;
  return { texts, shows, members, videos, podcasts, photos };
}

// ---------- Área administrativa (as regras de segurança do banco exigem login de admin) ----------

export type EditableRow = Record<string, unknown> & { id: string };

export async function createItem(table: ResourceTable, values: Record<string, unknown>): Promise<void> {
  const row = { ...values };
  if (['members', 'videos', 'podcasts', 'photos'].includes(table)) {
    const { data } = await supabase.from(table).select('position').order('position', { ascending: false }).limit(1);
    const last = (data?.[0] as { position: number } | undefined)?.position ?? -1;
    row.position = last + 1;
  }
  const { error } = await supabase.from(table).insert(row);
  if (error) throw friendlyError(error, 'Não foi possível salvar.');
}

export async function updateItem(table: ResourceTable, id: string, values: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from(table).update(values).eq('id', id);
  if (error) throw friendlyError(error, 'Não foi possível salvar.');
}

export async function deleteItem(table: ResourceTable, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw friendlyError(error, 'Não foi possível excluir.');
}

/** Troca a posição de dois itens (subir/descer na lista). */
export async function swapPositions(table: ResourceTable, a: { id: string; position: number }, b: { id: string; position: number }): Promise<void> {
  const first = await supabase.from(table).update({ position: b.position }).eq('id', a.id);
  if (first.error) throw friendlyError(first.error, 'Não foi possível reordenar.');
  const second = await supabase.from(table).update({ position: a.position }).eq('id', b.id);
  if (second.error) throw friendlyError(second.error, 'Não foi possível reordenar.');
}

export async function saveTexts(values: SiteTexts): Promise<void> {
  const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) throw friendlyError(error, 'Não foi possível salvar os textos.');
}

export function assertNever(value: never): never {
  throw new ServiceError(`Valor inesperado: ${String(value)}`);
}
