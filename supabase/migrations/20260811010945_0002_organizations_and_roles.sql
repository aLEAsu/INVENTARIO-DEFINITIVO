-- Introduce organizaciones y roles multiusuario, sin romper el modelo actual
-- de RLS por user_id (las policies legacy se retiran en una migracion posterior,
-- solo despues de validar que las nuevas policies por organizacion funcionan).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin_ti','tecnico_ti','talento_humano','lector','colaborador')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Funciones auxiliares para RLS (security definer para evitar recursion sobre
-- organization_members, que tambien tiene RLS habilitado).
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
  );
$$;

-- Auto-provisionar profile al crear un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (user_id, full_name)
select id, email from auth.users
on conflict (user_id) do nothing;

-- Columnas de organizacion en las tablas existentes (nullable primero).
alter table public.assets add column if not exists organization_id uuid references public.organizations(id);
alter table public.movements add column if not exists organization_id uuid references public.organizations(id);
alter table public.maintenance add column if not exists organization_id uuid references public.organizations(id);
alter table public.catalogs add column if not exists organization_id uuid references public.organizations(id);

-- Backfill: organizacion por defecto "UNOP", cada usuario existente como owner,
-- y asignar organization_id a las filas existentes segun su user_id.
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations where name = 'UNOP' limit 1;
  if v_org_id is null then
    insert into public.organizations (name) values ('UNOP') returning id into v_org_id;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  select v_org_id, u.id, 'owner'
  from auth.users u
  on conflict (organization_id, user_id) do nothing;

  update public.assets set organization_id = v_org_id where organization_id is null;
  update public.movements set organization_id = v_org_id where organization_id is null;
  update public.maintenance set organization_id = v_org_id where organization_id is null;
  update public.catalogs set organization_id = v_org_id where organization_id is null;
end $$;

alter table public.assets alter column organization_id set not null;
alter table public.movements alter column organization_id set not null;
alter table public.maintenance alter column organization_id set not null;
alter table public.catalogs alter column organization_id set not null;

create index if not exists assets_org_idx on public.assets(organization_id);
create index if not exists movements_org_idx on public.movements(organization_id);
create index if not exists maintenance_org_idx on public.maintenance(organization_id);
create index if not exists catalogs_org_idx on public.catalogs(organization_id);

-- RLS en las tablas nuevas.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "organizations_member_read" on public.organizations;
create policy "organizations_member_read" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "organizations_owner_update" on public.organizations;
create policy "organizations_owner_update" on public.organizations
  for update using (public.has_org_role(id, array['owner']))
  with check (public.has_org_role(id, array['owner']));

drop policy if exists "org_members_read" on public.organization_members;
create policy "org_members_read" on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists "org_members_manage" on public.organization_members;
create policy "org_members_manage" on public.organization_members
  for all using (public.has_org_role(organization_id, array['owner','admin_ti']))
  with check (public.has_org_role(organization_id, array['owner','admin_ti']));

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "profiles_org_read" on public.profiles;
create policy "profiles_org_read" on public.profiles
  for select using (
    exists (
      select 1 from public.organization_members om1
      join public.organization_members om2 on om2.organization_id = om1.organization_id
      where om1.user_id = auth.uid() and om2.user_id = profiles.user_id
    )
  );

-- Nuevas policies por organizacion en las tablas de inventario (se agregan
-- junto a las policies legacy por user_id; conviven mientras se valida RLS).
drop policy if exists "assets_org_read" on public.assets;
create policy "assets_org_read" on public.assets
  for select using (public.is_org_member(organization_id));
drop policy if exists "assets_org_write" on public.assets;
create policy "assets_org_write" on public.assets
  for all using (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "movements_org_read" on public.movements;
create policy "movements_org_read" on public.movements
  for select using (public.is_org_member(organization_id));
drop policy if exists "movements_org_write" on public.movements;
create policy "movements_org_write" on public.movements
  for all using (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "maintenance_org_read" on public.maintenance;
create policy "maintenance_org_read" on public.maintenance
  for select using (public.is_org_member(organization_id));
drop policy if exists "maintenance_org_write" on public.maintenance;
create policy "maintenance_org_write" on public.maintenance
  for all using (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "catalogs_org_read" on public.catalogs;
create policy "catalogs_org_read" on public.catalogs
  for select using (public.is_org_member(organization_id));
drop policy if exists "catalogs_org_write" on public.catalogs;
create policy "catalogs_org_write" on public.catalogs
  for all using (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (public.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));
