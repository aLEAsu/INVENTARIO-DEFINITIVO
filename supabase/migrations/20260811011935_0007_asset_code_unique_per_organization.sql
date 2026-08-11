-- El codigo interno de un activo debe ser unico por organizacion, no por
-- usuario individual: dos tecnicos de la misma organizacion no deben poder
-- registrar el mismo codigo. La restriccion legacy (user_id, code) no
-- detectaba ese choque entre usuarios de una misma organizacion.
alter table public.assets drop constraint if exists assets_user_id_code_key;
alter table public.assets add constraint assets_organization_id_code_key unique (organization_id, code);
