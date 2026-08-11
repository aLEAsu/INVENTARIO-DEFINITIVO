-- Las policies legacy "*_owner" (por user_id) permitian que cualquier usuario
-- autenticado insertara/editara filas en CUALQUIER organizacion, ya que
-- user_id toma por defecto auth.uid() sin validar organization_id. Confirmado
-- con una prueba de RLS (insert de prueba revertido, nunca persistido). Se
-- retiran ahora que las policies por organizacion (*_org_read/*_org_write)
-- ya estan validadas como equivalentes para el propietario real.

drop policy if exists "assets_owner" on public.assets;
drop policy if exists "movements_owner" on public.movements;
drop policy if exists "maintenance_owner" on public.maintenance;
drop policy if exists "catalogs_owner" on public.catalogs;
