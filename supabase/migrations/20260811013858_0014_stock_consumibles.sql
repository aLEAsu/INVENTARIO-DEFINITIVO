create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  unit text not null default 'unidad',
  min_stock numeric not null default 0,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  type text not null check (type in ('entrada','salida')),
  quantity numeric not null check (quantity > 0),
  reason text,
  movement_date date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists inventory_items_org_idx on public.inventory_items(organization_id);
create index if not exists stock_movements_org_idx on public.stock_movements(organization_id);
create index if not exists stock_movements_item_idx on public.stock_movements(item_id);

alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "inventory_items_org_read" on public.inventory_items;
create policy "inventory_items_org_read" on public.inventory_items for select using (private.is_org_member(organization_id));
drop policy if exists "inventory_items_org_write" on public.inventory_items;
create policy "inventory_items_org_write" on public.inventory_items for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop policy if exists "stock_movements_org_read" on public.stock_movements;
create policy "stock_movements_org_read" on public.stock_movements for select using (private.is_org_member(organization_id));
drop policy if exists "stock_movements_org_write" on public.stock_movements;
create policy "stock_movements_org_write" on public.stock_movements for all
  using (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']))
  with check (private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti']));

drop trigger if exists trg_audit_inventory_items on public.inventory_items;
create trigger trg_audit_inventory_items
  after insert or update or delete on public.inventory_items
  for each row execute function private.fn_audit_row();

drop trigger if exists trg_audit_stock_movements on public.stock_movements;
create trigger trg_audit_stock_movements
  after insert or update or delete on public.stock_movements
  for each row execute function private.fn_audit_row();
