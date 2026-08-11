create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, parent_id, name)
);

create index if not exists locations_org_idx on public.locations(organization_id);
create index if not exists locations_site_idx on public.locations(site_id);
create index if not exists areas_org_idx on public.areas(organization_id);
create index if not exists categories_org_idx on public.categories(organization_id);
create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists sites_org_idx on public.sites(organization_id);

alter table public.sites enable row level security;
alter table public.locations enable row level security;
alter table public.areas enable row level security;
alter table public.categories enable row level security;

drop policy if exists "sites_org_read" on public.sites;
create policy "sites_org_read" on public.sites for select using (private.is_org_member(organization_id));
drop policy if exists "sites_org_write" on public.sites;
create policy "sites_org_write" on public.sites for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "locations_org_read" on public.locations;
create policy "locations_org_read" on public.locations for select using (private.is_org_member(organization_id));
drop policy if exists "locations_org_write" on public.locations;
create policy "locations_org_write" on public.locations for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "areas_org_read" on public.areas;
create policy "areas_org_read" on public.areas for select using (private.is_org_member(organization_id));
drop policy if exists "areas_org_write" on public.areas;
create policy "areas_org_write" on public.areas for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "categories_org_read" on public.categories;
create policy "categories_org_read" on public.categories for select using (private.is_org_member(organization_id));
drop policy if exists "categories_org_write" on public.categories;
create policy "categories_org_write" on public.categories for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));
