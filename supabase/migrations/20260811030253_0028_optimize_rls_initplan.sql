-- auth.uid() envuelto en (select ...) se evalua una vez por consulta en vez
-- de una vez por fila (auth_rls_initplan de get_advisors). Sin cambio de
-- comportamiento, solo de plan de ejecucion.

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "profiles_org_read" on public.profiles;
create policy "profiles_org_read" on public.profiles
  for select using (
    exists (
      select 1 from public.organization_members om1
      join public.organization_members om2 on om2.organization_id = om1.organization_id
      where om1.user_id = (select auth.uid()) and om2.user_id = profiles.user_id
    )
  );

drop policy if exists "incident_subscribers_own_write" on public.incident_subscribers;
create policy "incident_subscribers_own_write" on public.incident_subscribers for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
