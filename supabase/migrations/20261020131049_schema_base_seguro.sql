-- =====================================================================
-- Movimento TBT — schema base. Princípio: nada é público por padrão.
-- =====================================================================

-- ---------- Administradores ----------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (char_length(email) <= 254),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Funções utilitárias ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- Textos do site ----------
create table public.site_content (
  key text primary key check (key ~ '^[A-Za-z0-9]{1,60}$'),
  value text not null check (char_length(value) <= 5000),
  updated_at timestamptz not null default now()
);

-- ---------- Espetáculos ----------
create table public.shows (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  group_name text check (char_length(group_name) <= 120),
  date date not null,
  time text check (time is null or time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  place text check (char_length(place) <= 150),
  price text check (char_length(price) <= 80),
  image_url text check (image_url is null or image_url = '' or (image_url ~* '^https://' and char_length(image_url) <= 500)),
  description text check (char_length(description) <= 1500),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- História e notícias ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (category in ('Notícia','História')),
  date date not null,
  image_url text check (image_url is null or image_url = '' or (image_url ~* '^https://' and char_length(image_url) <= 500)),
  excerpt text check (char_length(excerpt) <= 3000),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Elenco ----------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  name text not null check (char_length(name) between 1 and 100),
  role text check (char_length(role) <= 150),
  bio text check (char_length(bio) <= 800),
  photo_url text check (photo_url is null or photo_url = '' or (photo_url ~* '^https://' and char_length(photo_url) <= 500)),
  link_url text check (link_url is null or link_url = '' or (link_url ~* '^https?://' and char_length(link_url) <= 500)),
  link_label text check (char_length(link_label) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Mídias ----------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  title text not null check (char_length(title) between 1 and 150),
  who text check (char_length(who) <= 150),
  href text not null check (href ~* '^https?://' and char_length(href) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.podcasts (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  n text check (char_length(n) <= 8),
  title text not null check (char_length(title) between 1 and 150),
  href text not null check (href ~* '^https?://' and char_length(href) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  caption text not null check (char_length(caption) between 1 and 150),
  taken_when text check (char_length(taken_when) <= 40),
  src text not null check (src ~* '^https://' and char_length(src) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Mensagens de contato ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  subject text not null check (subject in ('Quero entrar em contato','Tenho uma sugestão','Quero fazer parte do movimento','Imprensa')),
  message text not null check (char_length(btrim(message)) between 5 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Limite de envios no servidor (anti-abuso): por e-mail e global.
create or replace function public.limit_contact_rate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.contact_messages
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Muitas mensagens deste e-mail. Tente novamente mais tarde.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_messages
      where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Recebemos muitas mensagens agora. Tente novamente em alguns minutos.' using errcode = 'P0001';
  end if;
  return new;
end; $$;
revoke all on function public.limit_contact_rate() from public;
create trigger trg_limit_contact_rate before insert on public.contact_messages
  for each row execute function public.limit_contact_rate();

-- ---------- Auditoria ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  action text not null,
  table_name text not null,
  row_id text
);

create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare rid text;
begin
  rid := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
                  (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'key',
                  (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'user_id');
  insert into public.audit_log(actor, actor_email, action, table_name, row_id)
  values ((select auth.uid()), (select auth.jwt() ->> 'email'), tg_op, tg_table_name, rid);
  return null;
end; $$;
revoke all on function public.write_audit() from public;

do $$
declare t text;
begin
  foreach t in array array['site_content','shows','posts','members','videos','podcasts','photos'] loop
    execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute function public.write_audit()', t);
  end loop;
  foreach t in array array['shows','posts','members','videos','podcasts','photos'] loop
    execute format('create trigger trg_touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
create trigger trg_touch before update on public.site_content for each row execute function public.touch_updated_at();
create trigger trg_audit_admins after insert or delete on public.admins for each row execute function public.write_audit();

-- ---------- Row Level Security: ligada em TUDO ----------
alter table public.admins enable row level security;
alter table public.site_content enable row level security;
alter table public.shows enable row level security;
alter table public.posts enable row level security;
alter table public.members enable row level security;
alter table public.videos enable row level security;
alter table public.podcasts enable row level security;
alter table public.photos enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_log enable row level security;

-- Privilégios mínimos (RLS ainda filtra por cima)
revoke all on all tables in schema public from anon, authenticated;
grant select on public.site_content, public.shows, public.posts, public.members, public.videos, public.podcasts, public.photos to anon, authenticated;
grant insert, update, delete on public.site_content, public.shows, public.posts, public.members, public.videos, public.podcasts, public.photos to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.admins, public.audit_log to authenticated;

-- Leitura pública apenas do conteúdo publicado
create policy "site_content leitura publica" on public.site_content for select to anon, authenticated using (true);
create policy "shows leitura publica" on public.shows for select to anon, authenticated using (published or (select public.is_admin()));
create policy "posts leitura publica" on public.posts for select to anon, authenticated using (published or (select public.is_admin()));
create policy "members leitura publica" on public.members for select to anon, authenticated using (true);
create policy "videos leitura publica" on public.videos for select to anon, authenticated using (true);
create policy "podcasts leitura publica" on public.podcasts for select to anon, authenticated using (true);
create policy "photos leitura publica" on public.photos for select to anon, authenticated using (true);

-- Escrita somente por administradores
do $$
declare t text;
begin
  foreach t in array array['site_content','shows','posts','members','videos','podcasts','photos'] loop
    execute format('create policy "%s admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t, t);
    execute format('create policy "%s admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t, t);
    execute format('create policy "%s admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t, t);
  end loop;
end $$;

-- Contato: qualquer pessoa só INSERE; só admin lê/gerencia
create policy "contato envio publico" on public.contact_messages for insert to anon, authenticated with check (read = false);
create policy "contato admin ler" on public.contact_messages for select to authenticated using ((select public.is_admin()));
create policy "contato admin atualizar" on public.contact_messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contato admin excluir" on public.contact_messages for delete to authenticated using ((select public.is_admin()));

-- Admins e auditoria: só admin lê; ninguém escreve direto (apenas Edge Function/trigger)
create policy "admins ler" on public.admins for select to authenticated using ((select public.is_admin()));
create policy "auditoria ler" on public.audit_log for select to authenticated using ((select public.is_admin()));

-- ---------- Armazenamento de imagens ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

create policy "imagens admin enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and (select public.is_admin()));
create policy "imagens admin atualizar" on storage.objects for update to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()))
  with check (bucket_id = 'site-images' and (select public.is_admin()));
create policy "imagens admin excluir" on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and (select public.is_admin()));
