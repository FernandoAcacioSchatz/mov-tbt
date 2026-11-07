-- Capa dos vídeos (imagem do próprio site ou https://).
alter table public.videos add column cover_url text check (cover_url is null or public.valid_image_url(cover_url));
