alter table public.members drop constraint members_bio_check;
alter table public.members add constraint members_bio_check check (char_length(bio) <= 2000);
