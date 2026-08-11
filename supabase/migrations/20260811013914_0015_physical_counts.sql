create table if not exists public.physical_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope_location_id uuid references public.locations(id) on delete set null,
  status text not null default 'abierto' check (status in ('abierto','cerrado')),
  opened_by uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  closing_notes text,
  closed_by uuid references auth.users(id),
  closed_at timestamptz
);

create table if not exists public.physical_count_items (
  id uuid primary key default gen_random_uuid(),
  physical_count_id uuid not null references public.physical_counts(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  expected boolean not null default true,
  found boolean not null default false,
  counted_by uuid references auth.users(id),
  counted_at timestamptz,
  notes text,
  unique (physical_count_id, asset_id)
);

create index if not exists physical_counts_org_idx on public.physical_counts(organization_id);
create index if not exists physical_count_items_count_idx on public.physical_count_items(physical_count_id);
create index if not exists physical_count_items_asset_idx on public.physical_count_items(asset_id);

alter table public.physical_counts enable row level security;
alter table public.physical_count_items enable row level security;

drop policy if exists "physical_counts_org_read" on public.physical_counts;
create policy "physical_counts_org_read" on public.physical_counts for select using (private.is_org_member(organization_id));
drop policy if exists "physical_counts_org_write" on public.physical_counts;
create policy "physical_counts_org_write" on public.physical_counts for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

-- physical_count_items no tiene organization_id propio: se resuelve via el
-- conteo padre (physical_counts), que si tiene RLS por organizacion.
drop policy if exists "physical_count_items_read" on public.physical_count_items;
create policy "physical_count_items_read" on public.physical_count_items for select
  using (exists (
    select 1 from public.physical_counts pc
    where pc.id = physical_count_items.physical_count_id and private.is_org_member(pc.organization_id)
  ));
drop policy if exists "physical_count_items_write" on public.physical_count_items;
create policy "physical_count_items_write" on public.physical_count_items for all
  using (exists (
    select 1 from public.physical_counts pc
    where pc.id = physical_count_items.physical_count_id
      and private.has_org_role(pc.organization_id, array['owner','admin_ti','tecnico_ti'])
  ))
  with check (exists (
    select 1 from public.physical_counts pc
    where pc.id = physical_count_items.physical_count_id
      and private.has_org_role(pc.organization_id, array['owner','admin_ti','tecnico_ti'])
  ));
