create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table if not exists public.incident_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

alter table public.services enable row level security;
alter table public.incident_categories enable row level security;

drop policy if exists "services_org_read" on public.services;
create policy "services_org_read" on public.services for select using (private.is_org_member(organization_id));
drop policy if exists "services_org_write" on public.services;
create policy "services_org_write" on public.services for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "incident_categories_org_read" on public.incident_categories;
create policy "incident_categories_org_read" on public.incident_categories for select using (private.is_org_member(organization_id));
drop policy if exists "incident_categories_org_write" on public.incident_categories;
create policy "incident_categories_org_write" on public.incident_categories for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

-- Semilla de categorias por defecto para cada organizacion existente.
insert into public.incident_categories (organization_id, name)
select o.id, c.name
from public.organizations o
cross join (values
  ('Periféricos'), ('Computadores'), ('Red'), ('Internet'), ('Software'),
  ('Impresoras'), ('Correo'), ('Servidores'), ('Seguridad'), ('Otras')
) as c(name)
on conflict (organization_id, name) do nothing;
