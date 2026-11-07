
revoke execute on function public.limit_contact_rate() from public, anon, authenticated;
revoke execute on function public.write_audit() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

alter policy "shows leitura publica" on public.shows to anon using (published);
alter policy "posts leitura publica" on public.posts to anon using (published);
create policy "shows leitura admin" on public.shows for select to authenticated using (published or (select public.is_admin()));
create policy "posts leitura admin" on public.posts for select to authenticated using (published or (select public.is_admin()));
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
