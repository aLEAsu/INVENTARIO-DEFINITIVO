-- Se detectaron policies adicionales ("private assets", "private movements",
-- "private maintenance", "private catalogs") creadas fuera de schema.sql
-- (probablemente desde el dashboard de Supabase), no versionadas y con la
-- misma condicion permisiva por user_id que ya se retiro en 0005. Confirmadas
-- via prueba de RLS que permitian escritura cruzada entre organizaciones.

drop policy if exists "private assets" on public.assets;
drop policy if exists "private movements" on public.movements;
drop policy if exists "private maintenance" on public.maintenance;
drop policy if exists "private catalogs" on public.catalogs;
