create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  document text,
  position text,
  area_id uuid references public.areas(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  email text,
  phone text,
  status text not null default 'activo' check (status in ('activo','inactivo')),
  hire_date date,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workers_org_idx on public.workers(organization_id);
create unique index if not exists workers_org_document_idx on public.workers(organization_id, document) where document is not null;

alter table public.workers enable row level security;

drop policy if exists "workers_org_read" on public.workers;
create policy "workers_org_read" on public.workers for select using (private.is_org_member(organization_id));
drop policy if exists "workers_org_write" on public.workers;
create policy "workers_org_write" on public.workers for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti','talento_humano']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti','talento_humano']));

drop trigger if exists trg_audit_workers on public.workers;
create trigger trg_audit_workers
  after insert or update or delete on public.workers
  for each row execute function private.fn_audit_row();
