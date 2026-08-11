create table if not exists public.incident_folio_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year int not null,
  next_number int not null default 1,
  primary key (organization_id, year)
);

alter table public.incident_folio_counters enable row level security;
-- Sin policies para clientes: solo la usa el trigger (security definer) de incidents.

create or replace function private.next_incident_folio(p_org_id uuid, p_year int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number int;
begin
  insert into public.incident_folio_counters (organization_id, year, next_number)
  values (p_org_id, p_year, 2)
  on conflict (organization_id, year)
  do update set next_number = incident_folio_counters.next_number + 1
  returning next_number - 1 into v_number;
  return v_number;
end;
$$;
