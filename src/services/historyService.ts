import { supabase } from './supabaseClient';
import { friendlyError } from './errors';
import type { HistoryClipping, HistoryFlyer, HistoryIntro, HistoryMedia, HistoryPost, HistoryYear } from '../types/content';

/** Tabelas da História. A ordem é SEMPRE pela data do acontecimento — nunca manual. */
export const HISTORY_TABLES = {
  postagens: 'history_posts',
  filipetas: 'history_flyers',
  clipagens: 'history_clippings',
  midia: 'history_media',
} as const;
export type HistoryTable = (typeof HISTORY_TABLES)[keyof typeof HISTORY_TABLES];

function yearRange(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** Anos que têm algum conteúdo, com a contagem de cada tipo. */
export async function fetchHistoryYears(): Promise<HistoryYear[]> {
  const { data, error } = await supabase.from('history_years').select('*').order('year', { ascending: true });
  if (error) throw friendlyError(error, 'Não foi possível carregar a História.');
  return (data ?? []) as HistoryYear[];
}

export async function fetchYearPosts(year: number): Promise<HistoryPost[]> {
  const { from, to } = yearRange(year);
  const { data, error } = await supabase.from('history_posts').select('*')
    .gte('event_date', from).lte('event_date', to)
    .order('event_date', { ascending: true }).order('title', { ascending: true });
  if (error) throw friendlyError(error, 'Não foi possível carregar as postagens.');
  return (data ?? []) as HistoryPost[];
}

export async function fetchYearFlyers(year: number): Promise<HistoryFlyer[]> {
  const { from, to } = yearRange(year);
  const { data, error } = await supabase.from('history_flyers').select('*')
    .gte('event_date', from).lte('event_date', to)
    .order('event_date', { ascending: true }).order('position', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw friendlyError(error, 'Não foi possível carregar as filipetas.');
  return (data ?? []) as HistoryFlyer[];
}

export async function fetchYearClippings(year: number): Promise<HistoryClipping[]> {
  const { from, to } = yearRange(year);
  const { data, error } = await supabase.from('history_clippings').select('*')
    .gte('event_date', from).lte('event_date', to)
    .order('event_date', { ascending: true }).order('position', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw friendlyError(error, 'Não foi possível carregar as clipagens.');
  return (data ?? []) as HistoryClipping[];
}

export async function fetchYearMedia(year: number): Promise<HistoryMedia[]> {
  const { from, to } = yearRange(year);
  const { data, error } = await supabase.from('history_media').select('*')
    .gte('event_date', from).lte('event_date', to)
    .order('event_date', { ascending: true }).order('title', { ascending: true });
  if (error) throw friendlyError(error, 'Não foi possível carregar as mídias.');
  return (data ?? []) as HistoryMedia[];
}

/** TBT na mídia, das mais recentes para as mais antigas (seção Mídias e página /midias). Admin também vê as ocultas. */
export async function fetchMedia(limit?: number): Promise<HistoryMedia[]> {
  let q = supabase.from('history_media').select('*')
    .order('event_date', { ascending: false }).order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw friendlyError(error, 'Não foi possível carregar as mídias.');
  return (data ?? []) as HistoryMedia[];
}

/** Evento disparado pelo painel quando as Mídias mudam (a seção da página inicial busca de novo). */
export const MEDIA_CHANGED = 'tbt:midias-alteradas';

export async function fetchMediaItem(id: string): Promise<HistoryMedia | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from('history_media').select('*').eq('id', id).maybeSingle();
  if (error) throw friendlyError(error, 'Não foi possível carregar a mídia.');
  return data as HistoryMedia | null;
}

export async function fetchIntro(year: number, kind: HistoryIntro['kind']): Promise<string | null> {
  const { data, error } = await supabase.from('history_intros').select('body').eq('year', year).eq('kind', kind).maybeSingle();
  if (error) throw friendlyError(error, 'Não foi possível carregar o texto.');
  return (data as { body: string } | null)?.body ?? null;
}

export interface PostWithNeighbors {
  post: HistoryPost;
  prev: Pick<HistoryPost, 'slug' | 'title' | 'event_date'> | null;
  next: Pick<HistoryPost, 'slug' | 'title' | 'event_date'> | null;
}

/** Uma postagem e as vizinhas na ordem cronológica de toda a História (para "anterior/próxima"). */
export async function fetchPostWithNeighbors(slug: string): Promise<PostWithNeighbors | null> {
  const [one, all] = await Promise.all([
    supabase.from('history_posts').select('*').eq('slug', slug).maybeSingle(),
    supabase.from('history_posts').select('slug,title,event_date').order('event_date', { ascending: true }).order('title', { ascending: true }),
  ]);
  if (one.error) throw friendlyError(one.error, 'Não foi possível carregar a postagem.');
  if (all.error) throw friendlyError(all.error, 'Não foi possível carregar a postagem.');
  const post = one.data as HistoryPost | null;
  if (!post) return null;
  const list = (all.data ?? []) as PostWithNeighbors['prev'][];
  const i = list.findIndex((p) => p?.slug === slug);
  return { post, prev: i > 0 ? list[i - 1] ?? null : null, next: i >= 0 ? list[i + 1] ?? null : null };
}

// ---------- Área administrativa (as regras do banco exigem login de admin) ----------

export async function saveHistoryItem(table: HistoryTable, id: string | null, values: Record<string, unknown>): Promise<void> {
  const { error } = id
    ? await supabase.from(table).update(values).eq('id', id)
    : await supabase.from(table).insert(values);
  if (error) throw friendlyError(error, 'Não foi possível salvar.');
}

export async function deleteHistoryItem(table: HistoryTable, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw friendlyError(error, 'Não foi possível excluir.');
}

export async function saveIntro(year: number, kind: HistoryIntro['kind'], body: string): Promise<void> {
  const text = body.trim();
  const { error } = text
    ? await supabase.from('history_intros').upsert({ year, kind, body: text }, { onConflict: 'year,kind' })
    : await supabase.from('history_intros').delete().eq('year', year).eq('kind', kind);
  if (error) throw friendlyError(error, 'Não foi possível salvar o texto.');
}

/** Usado pelo admin para listar tudo de um ano, inclusive postagens ocultas. */
export async function fetchYearAll(year: number) {
  const [posts, flyers, clippings, media, flyersIntro, clippingsIntro] = await Promise.all([
    fetchYearPosts(year), fetchYearFlyers(year), fetchYearClippings(year), fetchYearMedia(year), fetchIntro(year, 'filipetas'), fetchIntro(year, 'clipagens'),
  ]);
  return { posts, flyers, clippings, media, intros: { filipetas: flyersIntro ?? '', clipagens: clippingsIntro ?? '' } };
}
