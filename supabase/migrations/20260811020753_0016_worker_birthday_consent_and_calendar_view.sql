alter table public.workers add column if not exists birthday_consent boolean not null default false;

-- Vista que protege el año de nacimiento: dia/mes siempre visibles para
-- cualquier miembro con acceso de lectura a workers (ya filtrado por la RLS
-- de la tabla base gracias a security_invoker), el año completo solo si el
-- rol es owner/admin_ti/talento_humano.
create or replace view public.worker_birthday_calendar
with (security_invoker = true) as
select
  w.id as worker_id,
  w.organization_id,
  w.full_name,
  w.area_id,
  w.location_id,
  extract(month from w.birth_date)::int as birth_month,
  extract(day from w.birth_date)::int as birth_day,
  case
    when private.has_org_role(w.organization_id, array['owner','admin_ti','talento_humano'])
    then w.birth_date
    else null
  end as birth_date_full
from public.workers w
where w.birth_date is not null
  and w.deleted_at is null
  and w.birthday_consent = true;

grant select on public.worker_birthday_calendar to authenticated;
