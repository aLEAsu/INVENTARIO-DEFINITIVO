-- =====================================================================
-- Pruebas de humo de RLS — UNOP TI Hub
-- =====================================================================
-- Consolida las pruebas de RLS ejecutadas ad-hoc durante las Fases 1-4.
-- Seguro de correr repetidas veces contra el proyecto real: cada bloque
-- crea sus propios datos de prueba (usuarios ajenos, filas temporales)
-- dentro de una transaccion y termina en ROLLBACK, sin dejar residuos.
--
-- Requiere al menos una organizacion real con un miembro 'owner' ya
-- existente (se detecta automaticamente, no hay IDs hardcodeados de un
-- proyecto en particular). Ejecutar en el SQL Editor de Supabase, bloque
-- por bloque o completo. Cada bloque imprime su resultado; comparar con
-- el comentario "Esperado".
--
-- Para reejecutar tras cambios de esquema: si algun bloque falla porque
-- una tabla/columna no existe, es que el esquema cambio desde que se
-- escribio esta prueba -- actualizar el bloque correspondiente.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Aislamiento entre organizaciones: un usuario sin membresia no ve
--    absolutamente nada, en ningun modulo.
-- ---------------------------------------------------------------------
-- Esperado: todas las filas en 0.
begin;
insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000001');
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select 'foreign_assets' as check, count(*)::text as result from public.assets
union all select 'foreign_workers', count(*)::text from public.workers
union all select 'foreign_incidents', count(*)::text from public.incidents
union all select 'foreign_kb_articles', count(*)::text from public.kb_articles
union all select 'foreign_notification_deliveries', count(*)::text from public.notification_deliveries
union all select 'foreign_audit_log', count(*)::text from public.audit_log
union all select 'foreign_attachments', count(*)::text from public.attachments;

rollback;


-- ---------------------------------------------------------------------
-- 2. Un usuario ajeno no puede insertar datos en una organizacion que no
--    es la suya, ni siquiera fijando el organization_id a mano (cubre el
--    hallazgo real de Fase 1: policies legacy por user_id que ignoraban
--    la organizacion).
-- ---------------------------------------------------------------------
-- Esperado: ERROR 42501 "new row violates row-level security policy".
begin;
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;
  if v_org_id is null then
    raise exception 'No hay ninguna organizacion en el proyecto; no se puede correr esta prueba.';
  end if;
  insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000002');
  perform set_config('request.jwt.claims', json_build_object('sub','aaaaaaaa-0000-0000-0000-000000000002','role','authenticated')::text, true);
  perform set_config('app.test_org_id', v_org_id::text, true);
end $$;
set local role authenticated;

insert into public.assets (name, code, category, organization_id)
values ('Intento no autorizado', 'RLS-TEST-001', 'Otro', current_setting('app.test_org_id')::uuid);

rollback;


-- ---------------------------------------------------------------------
-- 3. Un miembro real (el 'owner' existente) SI ve los datos de su propia
--    organizacion.
-- ---------------------------------------------------------------------
-- Esperado: result > 0 si la organizacion tiene datos, 0 si esta vacia
-- (ambos son validos; lo importante es que NO de error de permisos).
begin;
do $$
declare
  v_owner_id uuid;
begin
  select user_id into v_owner_id from public.organization_members where role = 'owner' limit 1;
  if v_owner_id is null then
    raise exception 'No hay ningun owner en el proyecto; no se puede correr esta prueba.';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner_id, 'role','authenticated')::text, true);
end $$;
set local role authenticated;

select 'owner_sees_organizations' as check, count(*)::text as result from public.organizations
union all select 'owner_sees_assets', count(*)::text from public.assets;

rollback;


-- ---------------------------------------------------------------------
-- 4. Rol 'colaborador': puede reportar un incidente y comentarlo, pero
--    NO puede reclasificarlo/cerrarlo, y no ve comentarios 'interno'.
-- ---------------------------------------------------------------------
-- Esperado: colaborador_insert = true (folio generado); colaborador_ve_updates
-- = 1 (solo el publico, no el interno); estado_tras_intento = 'nuevo'
-- (el intento de UPDATE fue bloqueado por RLS, 0 filas afectadas).
begin;
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;
  insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000003');
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, 'aaaaaaaa-0000-0000-0000-000000000003', 'colaborador');
  perform set_config('app.test_org_id', v_org_id::text, true);
end $$;

insert into public.incidents (id, organization_id, type, title, status)
values ('aaaaaaaa-1111-0000-0000-000000000001', current_setting('app.test_org_id')::uuid, 'incidente', 'Prueba RLS colaborador', 'nuevo');
insert into public.incident_updates (incident_id, organization_id, comment, visibility)
values ('aaaaaaaa-1111-0000-0000-000000000001', current_setting('app.test_org_id')::uuid, 'Nota interna', 'interno');
insert into public.incident_updates (incident_id, organization_id, comment, visibility)
values ('aaaaaaaa-1111-0000-0000-000000000001', current_setting('app.test_org_id')::uuid, 'Nota publica', 'publico');

create temporary table t_results (check_name text, result text);
grant all on t_results to authenticated;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000003","role":"authenticated"}';

with ins as (
  insert into public.incidents (organization_id, type, title)
  values (current_setting('app.test_org_id')::uuid, 'incidente', 'Reporte de colaborador')
  returning folio
)
insert into t_results select 'colaborador_insert', (folio is not null)::text from ins;

insert into t_results
select 'colaborador_ve_updates', count(*)::text
from public.incident_updates where incident_id = 'aaaaaaaa-1111-0000-0000-000000000001';

update public.incidents set status = 'cerrado' where id = 'aaaaaaaa-1111-0000-0000-000000000001';
insert into t_results
select 'estado_tras_intento_no_autorizado', status from public.incidents where id = 'aaaaaaaa-1111-0000-0000-000000000001';

reset role;
select * from t_results;

rollback;


-- ---------------------------------------------------------------------
-- 5. Proteccion del ano de nacimiento: 'lector' ve solo dia/mes,
--    'talento_humano'/'owner'/'admin_ti' ven la fecha completa.
-- ---------------------------------------------------------------------
-- Esperado: as_lector.birth_date_full = null; as_owner.birth_date_full con valor.
begin;
do $$
declare
  v_org_id uuid;
  v_owner_id uuid;
  v_worker_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;
  select user_id into v_owner_id from public.organization_members where organization_id = v_org_id and role = 'owner' limit 1;

  insert into public.workers (id, organization_id, full_name, birth_date, birthday_consent)
  values ('aaaaaaaa-2222-0000-0000-000000000001', v_org_id, 'Trabajador de prueba RLS', '1990-05-15', true)
  returning id into v_worker_id;

  insert into auth.users (id) values ('aaaaaaaa-0000-0000-0000-000000000004');
  insert into public.organization_members (organization_id, user_id, role) values (v_org_id, 'aaaaaaaa-0000-0000-0000-000000000004', 'lector');

  perform set_config('app.test_owner_id', v_owner_id::text, true);
end $$;

create temporary table t_birthday (who text, birth_month int, birth_day int, birth_date_full date);
grant all on t_birthday to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000004","role":"authenticated"}', true);
insert into t_birthday select 'as_lector', birth_month, birth_day, birth_date_full from public.worker_birthday_calendar where worker_id = 'aaaaaaaa-2222-0000-0000-000000000001';

select set_config('request.jwt.claims', json_build_object('sub', current_setting('app.test_owner_id'), 'role','authenticated')::text, true);
insert into t_birthday select 'as_owner', birth_month, birth_day, birth_date_full from public.worker_birthday_calendar where worker_id = 'aaaaaaaa-2222-0000-0000-000000000001';

reset role;
select * from t_birthday;

rollback;


-- ---------------------------------------------------------------------
-- 6. Idempotencia de notificaciones: dos intentos con la misma
--    idempotency_key nunca producen dos filas (protege contra el cron
--    disparando dos veces).
-- ---------------------------------------------------------------------
-- Esperado: total_filas = 1.
begin;
do $$
declare
  v_org_id uuid;
  v_worker_id uuid;
  v_recipient_id uuid;
  v_job_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;

  insert into public.workers (organization_id, full_name) values (v_org_id, 'Worker idempotencia') returning id into v_worker_id;
  insert into public.birthday_notification_recipients (organization_id, phone_e164, label) values (v_org_id, '+573000000000', 'Prueba') returning id into v_recipient_id;
  insert into public.notification_jobs (organization_id, run_date, run_type, status) values (v_org_id, current_date, 'same_day', 'procesando') returning id into v_job_id;

  insert into public.notification_deliveries (job_id, organization_id, worker_id, recipient_id, idempotency_key, status)
  values (v_job_id, v_org_id, v_worker_id, v_recipient_id, 'rls-test-idempotency-key', 'enviado')
  on conflict (idempotency_key) do nothing;

  insert into public.notification_deliveries (job_id, organization_id, worker_id, recipient_id, idempotency_key, status)
  values (v_job_id, v_org_id, v_worker_id, v_recipient_id, 'rls-test-idempotency-key', 'enviado')
  on conflict (idempotency_key) do nothing;
end $$;

select 'total_filas' as check, count(*)::text as result
from public.notification_deliveries where idempotency_key = 'rls-test-idempotency-key';

rollback;


-- ---------------------------------------------------------------------
-- 7. Folios de incidentes consecutivos sin colision bajo creacion
--    secuencial en la misma organizacion.
-- ---------------------------------------------------------------------
-- Esperado: dos folios distintos, el segundo con el numero siguiente al primero.
begin;
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;
  perform set_config('app.test_org_id', v_org_id::text, true);
end $$;

with ins_a as (
  insert into public.incidents (organization_id, type, title)
  values (current_setting('app.test_org_id')::uuid, 'incidente', 'Folio A')
  returning folio
),
ins_b as (
  insert into public.incidents (organization_id, type, title)
  values (current_setting('app.test_org_id')::uuid, 'incidente', 'Folio B')
  returning folio
)
select 'A' as which, folio from ins_a
union all
select 'B', folio from ins_b;

rollback;
