create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  folio text,
  type text not null check (type in ('incidente','solicitud','problema','cambio','mantenimiento','aviso')),
  category_id uuid references public.incident_categories(id) on delete set null,
  priority text not null default 'P3' check (priority in ('P1','P2','P3','P4')),
  impact text,
  urgency text,
  affected_users_count int,
  asset_id uuid references public.assets(id) on delete set null,
  worker_id uuid references public.workers(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  status text not null default 'nuevo' check (status in ('nuevo','clasificado','en_progreso','en_espera','resuelto','cerrado','reabierto')),
  title text not null,
  description text,
  root_cause text,
  resolution text,
  preventive_actions text,
  responsible_user_id uuid references auth.users(id),
  commitment_date date,
  parent_incident_id uuid references public.incidents(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  unique (organization_id, folio)
);

create index if not exists incidents_org_idx on public.incidents(organization_id);
create index if not exists incidents_status_idx on public.incidents(organization_id, status);
create index if not exists incidents_asset_idx on public.incidents(asset_id);
create index if not exists incidents_parent_idx on public.incidents(parent_incident_id);

create or replace function private.set_incident_folio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_number int;
begin
  if new.folio is null then
    v_number := private.next_incident_folio(new.organization_id, v_year);
    new.folio := 'INC-' || v_year || '-' || lpad(v_number::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_incident_folio on public.incidents;
create trigger trg_incident_folio
  before insert on public.incidents
  for each row execute function private.set_incident_folio();

drop trigger if exists trg_audit_incidents on public.incidents;
create trigger trg_audit_incidents
  after insert or update or delete on public.incidents
  for each row execute function private.fn_audit_row();

alter table public.incidents enable row level security;

drop policy if exists "incidents_org_read" on public.incidents;
create policy "incidents_org_read" on public.incidents for select using (private.is_org_member(organization_id));

drop policy if exists "incidents_org_insert" on public.incidents;
create policy "incidents_org_insert" on public.incidents for insert
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti','colaborador']));

drop policy if exists "incidents_org_update" on public.incidents;
create policy "incidents_org_update" on public.incidents for update
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));
