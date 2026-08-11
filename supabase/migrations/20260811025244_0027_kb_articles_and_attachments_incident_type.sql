create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text,
  content text not null,
  related_incident_id uuid references public.incidents(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists kb_articles_org_idx on public.kb_articles(organization_id);

alter table public.kb_articles enable row level security;

drop policy if exists "kb_articles_read" on public.kb_articles;
create policy "kb_articles_read" on public.kb_articles for select using (private.is_org_member(organization_id));
drop policy if exists "kb_articles_write" on public.kb_articles;
create policy "kb_articles_write" on public.kb_articles for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

alter table public.attachments drop constraint if exists attachments_entity_type_check;
alter table public.attachments add constraint attachments_entity_type_check
  check (entity_type in ('asset','maintenance','physical_count','incident'));
