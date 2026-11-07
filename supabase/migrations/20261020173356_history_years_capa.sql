-- Anos da História com contagem por tipo + capa (foto da 1ª postagem do ano; senão, 1ª filipeta; senão, 1ª clipagem).
create or replace view public.history_years with (security_invoker = true) as
with counts as (
  select year::int,
         sum(case when kind = 'postagens' then 1 else 0 end)::int as postagens,
         sum(case when kind = 'filipetas' then 1 else 0 end)::int as filipetas,
         sum(case when kind = 'clipagens' then 1 else 0 end)::int as clipagens
  from (
    select extract(year from event_date) as year, 'postagens' as kind from public.history_posts where published
    union all select extract(year from event_date), 'filipetas' from public.history_flyers
    union all select extract(year from event_date), 'clipagens' from public.history_clippings
  ) t
  group by year
)
select c.year, c.postagens, c.filipetas, c.clipagens,
  coalesce(
    (select p.cover_url from public.history_posts p where p.published and p.cover_url is not null and extract(year from p.event_date) = c.year order by p.event_date, p.title limit 1),
    (select f.image_url from public.history_flyers f where extract(year from f.event_date) = c.year order by f.event_date, f.position limit 1),
    (select k.image_url from public.history_clippings k where extract(year from k.event_date) = c.year order by k.event_date, k.position limit 1)
  ) as cover_url
from counts c
order by c.year;
