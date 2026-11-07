-- Imagens podem ser https:// ou arquivo do próprio site (/images/...), sem "..".
alter table public.shows drop constraint shows_image_url_check;
alter table public.shows add constraint shows_image_url_check check (
  image_url is null or image_url = '' or (char_length(image_url) <= 500 and (image_url ~* '^https://' or (image_url ~ '^/images/[A-Za-z0-9_./-]+$' and position('..' in image_url) = 0))));

alter table public.posts drop constraint posts_image_url_check;
alter table public.posts add constraint posts_image_url_check check (
  image_url is null or image_url = '' or (char_length(image_url) <= 500 and (image_url ~* '^https://' or (image_url ~ '^/images/[A-Za-z0-9_./-]+$' and position('..' in image_url) = 0))));

alter table public.members drop constraint members_photo_url_check;
alter table public.members add constraint members_photo_url_check check (
  photo_url is null or photo_url = '' or (char_length(photo_url) <= 500 and (photo_url ~* '^https://' or (photo_url ~ '^/images/[A-Za-z0-9_./-]+$' and position('..' in photo_url) = 0))));

alter table public.photos drop constraint photos_src_check;
alter table public.photos add constraint photos_src_check check (
  char_length(src) <= 500 and (src ~* '^https://' or (src ~ '^/images/[A-Za-z0-9_./-]+$' and position('..' in src) = 0)));
