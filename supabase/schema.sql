-- ACTIVO · Esquema de respaldo privado para Supabase
-- Ejecútalo completo en Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  code text not null,
  category text not null,
  status text not null default 'activo',
  brand text, model text, serial text, tag text,
  location text, area text, responsible text, condition text,
  "acquisitionDate" date, "warrantyUntil" date, notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique(user_id, code)
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "assetId" uuid not null references public.assets(id) on delete cascade,
  "assetName" text, "assetCode" text,
  type text not null, date date not null, "from" text, "to" text,
  notes text, "createdBy" text, "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "assetId" uuid not null references public.assets(id) on delete cascade,
  "assetName" text, type text not null, date date not null, provider text,
  cost numeric default 0, status text not null default 'pendiente', notes text,
  "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);

create table if not exists public.catalogs (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  "updatedAt" timestamptz not null default now()
);

alter table public.assets enable row level security;
alter table public.movements enable row level security;
alter table public.maintenance enable row level security;
alter table public.catalogs enable row level security;

-- Solo el usuario autenticado puede leer o modificar sus propios registros.
create policy "private assets" on public.assets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "private movements" on public.movements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "private maintenance" on public.maintenance for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "private catalogs" on public.catalogs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists assets_owner_idx on public.assets(user_id);
create index if not exists movements_owner_asset_idx on public.movements(user_id, "assetId");
create index if not exists maintenance_owner_asset_idx on public.maintenance(user_id, "assetId");
