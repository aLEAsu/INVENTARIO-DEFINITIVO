create table if not exists public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid references auth.users(id),
  comment text,
  visibility text not null default 'publico' check (visibility in ('interno','publico')),
  status_from text,
  status_to text,
  created_at timestamptz not null default now()
);

create index if not exists incident_updates_incident_idx on public.incident_updates(incident_id, created_at);
create index if not exists incident_updates_org_idx on public.incident_updates(organization_id);

alter table public.incident_updates enable row level security;

drop policy if exists "incident_updates_read" on public.incident_updates;
create policy "incident_updates_read" on public.incident_updates for select
  using (
    visibility = 'publico' and private.is_org_member(organization_id)
    or private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti'])
  );

drop policy if exists "incident_updates_insert" on public.incident_updates;
create policy "incident_updates_insert" on public.incident_updates for insert
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti','colaborador']));
