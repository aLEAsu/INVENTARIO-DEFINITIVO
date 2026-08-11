create table if not exists public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  assigned_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists asset_assignments_org_idx on public.asset_assignments(organization_id);
create index if not exists asset_assignments_asset_idx on public.asset_assignments(asset_id);
create index if not exists asset_assignments_worker_idx on public.asset_assignments(worker_id);
-- Un activo solo puede tener una asignacion abierta (sin devolver) a la vez.
create unique index if not exists asset_assignments_open_idx on public.asset_assignments(asset_id) where returned_at is null;

alter table public.asset_assignments enable row level security;

drop policy if exists "asset_assignments_org_read" on public.asset_assignments;
create policy "asset_assignments_org_read" on public.asset_assignments for select using (private.is_org_member(organization_id));
drop policy if exists "asset_assignments_org_write" on public.asset_assignments;
create policy "asset_assignments_org_write" on public.asset_assignments for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop trigger if exists trg_audit_asset_assignments on public.asset_assignments;
create trigger trg_audit_asset_assignments
  after insert or update or delete on public.asset_assignments
  for each row execute function private.fn_audit_row();
