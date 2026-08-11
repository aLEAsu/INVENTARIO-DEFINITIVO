create table if not exists public.incident_subscribers (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (incident_id, user_id)
);

create table if not exists public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('preventiva','correctiva')),
  description text not null,
  responsible text,
  due_date date,
  status text not null default 'pendiente' check (status in ('pendiente','completada')),
  created_at timestamptz not null default now()
);

create index if not exists incident_subscribers_incident_idx on public.incident_subscribers(incident_id);
create index if not exists incident_actions_incident_idx on public.incident_actions(incident_id);

alter table public.incident_subscribers enable row level security;
alter table public.incident_actions enable row level security;

drop policy if exists "incident_subscribers_read" on public.incident_subscribers;
create policy "incident_subscribers_read" on public.incident_subscribers for select using (private.is_org_member(organization_id));
drop policy if exists "incident_subscribers_own_write" on public.incident_subscribers;
create policy "incident_subscribers_own_write" on public.incident_subscribers for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "incident_actions_read" on public.incident_actions;
create policy "incident_actions_read" on public.incident_actions for select using (private.is_org_member(organization_id));
drop policy if exists "incident_actions_write" on public.incident_actions;
create policy "incident_actions_write" on public.incident_actions for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));
