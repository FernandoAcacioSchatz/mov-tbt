-- História: três tipos separados (postagens, filipetas, clipagens), sempre ordenados pela data do acontecimento.

create or replace function public.valid_image_url(u text) returns boolean
language sql immutable set search_path to '' as $$
  select u is not null and char_length(u) <= 500
    and (u ~* '^https://' or (u ~ '^/images/[A-Za-z0-9_./-]+$' and position('..' in u) = 0));
$$;

create or replace function public.valid_image_urls(us text[]) returns boolean
language sql immutable set search_path to '' as $$
  select coalesce(bool_and(public.valid_image_url(u)), true) from unnest(us) as u;
$$;

-- "Hoje" no horário de Brasília (não no do servidor).
create or replace function public.today_br() returns date
language sql stable set search_path to '' as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

create table public.history_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title text not null check (char_length(title) between 1 and 200),
  event_date date not null,
  date_precision text not null default 'day' check (date_precision in ('day', 'month', 'year')),
  date_label text check (char_length(date_label) <= 150),
  group_name text check (char_length(group_name) <= 150),
  city text check (char_length(city) <= 80),
  venue text check (char_length(venue) <= 150),
  body text check (char_length(body) <= 20000),
  cover_url text check (cover_url is null or public.valid_image_url(cover_url)),
  photos text[] not null default '{}' check (cardinality(photos) <= 80 and public.valid_image_urls(photos)),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.history_flyers (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  date_precision text not null default 'year' check (date_precision in ('day', 'month', 'year')),
  image_url text not null check (public.valid_image_url(image_url)),
  caption text check (char_length(caption) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.history_clippings (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  date_precision text not null default 'day' check (date_precision in ('day', 'month', 'year')),
  image_url text not null check (public.valid_image_url(image_url)),
  newspaper text check (char_length(newspaper) <= 120),
  caption text check (char_length(caption) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Texto de abertura das páginas de filipetas/clipagens de cada ano.
create table public.history_intros (
  year integer not null check (year >= 2004),
  kind text not null check (kind in ('filipetas', 'clipagens')),
  body text not null check (char_length(body) between 1 and 5000),
  updated_at timestamptz not null default now(),
  primary key (year, kind)
);

create index history_posts_date_idx on public.history_posts (event_date, title);
create index history_flyers_date_idx on public.history_flyers (event_date, position);
create index history_clippings_date_idx on public.history_clippings (event_date, position);

-- Regra da História: de 01/01/2004 até hoje. Conferida ao cadastrar e quando a data muda.
create or replace function public.check_history_date() returns trigger
language plpgsql set search_path to '' as $$
begin
  if new.date_precision = 'year' then new.event_date := date_trunc('year', new.event_date)::date;
  elsif new.date_precision = 'month' then new.event_date := date_trunc('month', new.event_date)::date;
  end if;
  if tg_op = 'INSERT' or new.event_date is distinct from old.event_date then
    if new.event_date < date '2004-01-01' then
      raise exception using errcode = 'P0001', message = 'A História começa em 2004. Confira a data.';
    end if;
    if new.event_date > public.today_br() then
      raise exception using errcode = 'P0001', message = 'A História só aceita fatos que já aconteceram (data até hoje).';
    end if;
  end if;
  return new;
end; $$;

create or replace function public.check_history_intro_year() returns trigger
language plpgsql set search_path to '' as $$
begin
  if new.year > extract(year from public.today_br()) then
    raise exception using errcode = 'P0001', message = 'Esse ano ainda não chegou.';
  end if;
  return new;
end; $$;

-- Regra da Agenda: apresentação nova (ou com data alterada) não pode ser antes de hoje.
create or replace function public.check_show_date() returns trigger
language plpgsql set search_path to '' as $$
begin
  if (tg_op = 'INSERT' or new.date is distinct from old.date) and new.date < public.today_br() then
    raise exception using errcode = 'P0001', message = 'A Agenda só aceita apresentações de hoje em diante. Para registrar algo que já aconteceu, use a História.';
  end if;
  return new;
end; $$;

create trigger trg_history_date before insert or update on public.history_posts for each row execute function public.check_history_date();
create trigger trg_history_date before insert or update on public.history_flyers for each row execute function public.check_history_date();
create trigger trg_history_date before insert or update on public.history_clippings for each row execute function public.check_history_date();
create trigger trg_intro_year before insert or update on public.history_intros for each row execute function public.check_history_intro_year();
create trigger trg_show_date before insert or update on public.shows for each row execute function public.check_show_date();

create trigger trg_touch before update on public.history_posts for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.history_flyers for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.history_clippings for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.history_intros for each row execute function public.touch_updated_at();

create trigger trg_audit after insert or update or delete on public.history_posts for each row execute function public.write_audit();
create trigger trg_audit after insert or update or delete on public.history_flyers for each row execute function public.write_audit();
create trigger trg_audit after insert or update or delete on public.history_clippings for each row execute function public.write_audit();
create trigger trg_audit after insert or update or delete on public.history_intros for each row execute function public.write_audit();

-- Segurança (mesmo padrão das outras tabelas): leitura pública, escrita só admin.
alter table public.history_posts enable row level security;
alter table public.history_flyers enable row level security;
alter table public.history_clippings enable row level security;
alter table public.history_intros enable row level security;

create policy "history_posts leitura publica" on public.history_posts for select to anon using (published);
create policy "history_posts leitura admin" on public.history_posts for select to authenticated using (published or (select public.is_admin()));
create policy "history_posts admin insert" on public.history_posts for insert to authenticated with check ((select public.is_admin()));
create policy "history_posts admin update" on public.history_posts for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history_posts admin delete" on public.history_posts for delete to authenticated using ((select public.is_admin()));

create policy "history_flyers leitura publica" on public.history_flyers for select to anon, authenticated using (true);
create policy "history_flyers admin insert" on public.history_flyers for insert to authenticated with check ((select public.is_admin()));
create policy "history_flyers admin update" on public.history_flyers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history_flyers admin delete" on public.history_flyers for delete to authenticated using ((select public.is_admin()));

create policy "history_clippings leitura publica" on public.history_clippings for select to anon, authenticated using (true);
create policy "history_clippings admin insert" on public.history_clippings for insert to authenticated with check ((select public.is_admin()));
create policy "history_clippings admin update" on public.history_clippings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history_clippings admin delete" on public.history_clippings for delete to authenticated using ((select public.is_admin()));

create policy "history_intros leitura publica" on public.history_intros for select to anon, authenticated using (true);
create policy "history_intros admin insert" on public.history_intros for insert to authenticated with check ((select public.is_admin()));
create policy "history_intros admin update" on public.history_intros for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "history_intros admin delete" on public.history_intros for delete to authenticated using ((select public.is_admin()));

-- Anos que têm conteúdo, com a contagem de cada tipo (respeita as regras de leitura acima).
create view public.history_years with (security_invoker = true) as
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
order by year;

grant select on public.history_years to anon, authenticated;
revoke execute on function public.today_br() from public;
grant execute on function public.today_br() to anon, authenticated;
