create table public.history_media (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  date_precision text not null default 'day' check (date_precision in ('day','month','year')),
  title text not null check (char_length(title) between 1 and 200),
  media_type text not null default 'materia' check (media_type in ('materia','video','foto','postagem','link')),
  outlet text check (char_length(outlet) <= 120),
  url text check (url is null or (char_length(url) <= 2000 and url ~* '^https://[^\s]+$')),
  video_url text check (video_url is null or (char_length(video_url) <= 2000 and video_url ~* '^https://[^\s]+$')),
  image_url text check (image_url is null or public.valid_image_url(image_url)),
  photos text[] not null default '{}' check (cardinality(photos) <= 80 and public.valid_image_urls(photos)),
  body text check (char_length(body) <= 5000),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.history_media is 'TBT na mídia: aparece na seção Mídias e, por ano, na História (categoria "Na mídia").';
create index history_media_event_date_idx on public.history_media (event_date desc);

alter table public.history_media enable row level security;
create policy "history_media leitura publica" on public.history_media for select to anon using (published);
create policy "history_media leitura admin" on public.history_media for select to authenticated using (published or (select public.is_admin()));
create policy "history_media admin insert" on public.history_media for insert to authenticated with check ((select public.is_admin()));
create policy "history_media admin update" on public.history_media for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history_media admin delete" on public.history_media for delete to authenticated using ((select public.is_admin()));

create trigger trg_touch before update on public.history_media for each row execute function public.touch_updated_at();
create trigger trg_history_date before insert or update on public.history_media for each row execute function public.check_history_date();
create trigger trg_audit after insert or update or delete on public.history_media for each row execute function public.write_audit();

create or replace view public.history_years with (security_invoker = true) as
 WITH counts AS (
   SELECT t.year::integer AS year,
     sum(CASE WHEN t.kind = 'postagens' THEN 1 ELSE 0 END)::integer AS postagens,
     sum(CASE WHEN t.kind = 'filipetas' THEN 1 ELSE 0 END)::integer AS filipetas,
     sum(CASE WHEN t.kind = 'clipagens' THEN 1 ELSE 0 END)::integer AS clipagens,
     sum(CASE WHEN t.kind = 'midia' THEN 1 ELSE 0 END)::integer AS midia
   FROM (
     SELECT EXTRACT(year FROM event_date) AS year, 'postagens'::text AS kind FROM public.history_posts WHERE published
     UNION ALL SELECT EXTRACT(year FROM event_date), 'filipetas' FROM public.history_flyers
     UNION ALL SELECT EXTRACT(year FROM event_date), 'clipagens' FROM public.history_clippings
     UNION ALL SELECT EXTRACT(year FROM event_date), 'midia' FROM public.history_media WHERE published
   ) t
   GROUP BY t.year
 )
 SELECT year, postagens, filipetas, clipagens,
   COALESCE(
     (SELECT p.cover_url FROM public.history_posts p WHERE p.published AND p.cover_url IS NOT NULL AND EXTRACT(year FROM p.event_date) = c.year::numeric ORDER BY p.event_date, p.title LIMIT 1),
     (SELECT f.image_url FROM public.history_flyers f WHERE EXTRACT(year FROM f.event_date) = c.year::numeric ORDER BY f.event_date, f.position LIMIT 1),
     (SELECT k.image_url FROM public.history_clippings k WHERE EXTRACT(year FROM k.event_date) = c.year::numeric ORDER BY k.event_date, k.position LIMIT 1),
     (SELECT m.image_url FROM public.history_media m WHERE m.published AND m.image_url IS NOT NULL AND EXTRACT(year FROM m.event_date) = c.year::numeric ORDER BY m.event_date, m.title LIMIT 1)
   ) AS cover_url,
   midia
 FROM counts c
 ORDER BY year;
