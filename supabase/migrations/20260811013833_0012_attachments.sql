create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('asset','maintenance','physical_count')),
  entity_id uuid not null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists attachments_org_idx on public.attachments(organization_id);
create index if not exists attachments_entity_idx on public.attachments(entity_type, entity_id);

alter table public.attachments enable row level security;

drop policy if exists "attachments_org_read" on public.attachments;
create policy "attachments_org_read" on public.attachments for select using (private.is_org_member(organization_id));
drop policy if exists "attachments_org_write" on public.attachments;
create policy "attachments_org_write" on public.attachments for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

-- Bucket privado; el path de cada objeto debe empezar con "{organization_id}/..."
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_storage_read" on storage.objects;
create policy "attachments_storage_read" on storage.objects for select
  using (bucket_id = 'attachments' and private.is_org_member((storage.foldername(name))[1]::uuid));

drop policy if exists "attachments_storage_insert" on storage.objects;
create policy "attachments_storage_insert" on storage.objects for insert
  with check (bucket_id = 'attachments' and private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "attachments_storage_delete" on storage.objects;
create policy "attachments_storage_delete" on storage.objects for delete
  using (bucket_id = 'attachments' and private.has_org_role((storage.foldername(name))[1]::uuid, array['owner','admin_ti','tecnico_ti']));
