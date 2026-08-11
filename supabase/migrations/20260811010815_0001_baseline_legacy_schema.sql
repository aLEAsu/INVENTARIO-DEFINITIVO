-- Baseline: reproduce el esquema actual (aplicado manualmente hace tiempo) para
-- establecer un punto de partida real en el historial de migraciones.
-- Todo es idempotente: no debe alterar el esquema/datos existentes.

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  code text not null,
  category text not null,
  status text not null default 'activo',
  brand text,
  model text,
  serial text,
  tag text,
  location text,
  area text,
  responsible text,
  condition text,
  "acquisitionDate" date,
  "warrantyUntil" date,
  notes text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now(),
  unique(user_id, code)
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "assetId" uuid not null references public.assets(id) on delete cascade,
  "assetName" text,
  "assetCode" text,
  type text not null,
  date date not null,
  "from" text,
  "to" text,
  notes text,
  "createdBy" text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "assetId" uuid not null references public.assets(id) on delete cascade,
  "assetName" text,
  type text not null,
  date date not null,
  provider text,
  cost numeric default 0,
  status text not null default 'pendiente',
  notes text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists public.catalogs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  items jsonb default '[]',
  "updatedAt" timestamptz default now()
);

alter table public.assets enable row level security;
alter table public.movements enable row level security;
alter table public.maintenance enable row level security;
alter table public.catalogs enable row level security;

drop policy if exists "assets_owner" on public.assets;
create policy "assets_owner" on public.assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "movements_owner" on public.movements;
create policy "movements_owner" on public.movements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "maintenance_owner" on public.maintenance;
create policy "maintenance_owner" on public.maintenance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "catalogs_owner" on public.catalogs;
create policy "catalogs_owner" on public.catalogs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists assets_owner_idx on public.assets(user_id);
create index if not exists movements_owner_asset_idx on public.movements(user_id, "assetId");
create index if not exists maintenance_owner_asset_idx on public.maintenance(user_id, "assetId");
