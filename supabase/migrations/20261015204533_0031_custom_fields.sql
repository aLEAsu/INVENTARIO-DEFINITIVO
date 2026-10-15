-- Campos personalizados por organizacion: permite que cada "trabajo" defina
-- sus propios campos para activos, trabajadores e incidentes sin tocar
-- codigo (base del modelo de datos "totalmente configurable").
create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('asset','worker','incident')),
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  field_type text not null check (field_type in ('text','number','date','boolean','select')),
  options jsonb,
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, entity_type, key)
);

create table if not exists public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  field_id uuid not null references public.custom_field_definitions(id) on delete cascade,
  entity_type text not null check (entity_type in ('asset','worker','incident')),
  entity_id uuid not null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (field_id, entity_id)
);

create index if not exists custom_field_definitions_org_idx on public.custom_field_definitions(organization_id, entity_type);
create index if not exists custom_field_values_org_idx on public.custom_field_values(organization_id, entity_type);
create index if not exists custom_field_values_entity_idx on public.custom_field_values(entity_type, entity_id);

alter table public.custom_field_definitions enable row level security;
alter table public.custom_field_values enable row level security;

drop policy if exists "custom_field_definitions_org_read" on public.custom_field_definitions;
create policy "custom_field_definitions_org_read" on public.custom_field_definitions for select
  using (private.is_org_member(organization_id));
drop policy if exists "custom_field_definitions_org_write" on public.custom_field_definitions;
create policy "custom_field_definitions_org_write" on public.custom_field_definitions for all
  using (private.has_org_role(organization_id, array['owner','admin_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti']));

drop policy if exists "custom_field_values_org_read" on public.custom_field_values;
create policy "custom_field_values_org_read" on public.custom_field_values for select
  using (private.is_org_member(organization_id));
drop policy if exists "custom_field_values_org_write" on public.custom_field_values;
create policy "custom_field_values_org_write" on public.custom_field_values for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

-- Auditoria solo en valores (datos mutables), igual que assets/workers/incidents;
-- las definiciones de campo son catalogo/config, igual que categories, sin auditoria.
drop trigger if exists trg_audit_custom_field_values on public.custom_field_values;
create trigger trg_audit_custom_field_values
  after insert or update or delete on public.custom_field_values
  for each row execute function private.fn_audit_row();
