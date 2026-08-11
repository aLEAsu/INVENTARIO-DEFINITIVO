-- Los helpers de RLS y los triggers de auditoria no deben ser invocables como
-- endpoints publicos via PostgREST (/rest/v1/rpc/...). Se mueven a un schema
-- que no forma parte de los schemas expuestos por la API. Postgres resuelve
-- las policies y triggers existentes por OID de funcion, no por nombre, asi
-- que este cambio de schema es transparente para lo ya creado.

create schema if not exists private;

alter function public.is_org_member(uuid) set schema private;
alter function public.has_org_role(uuid, text[]) set schema private;
alter function public.fn_audit_row() set schema private;
alter function public.handle_new_user() set schema private;
