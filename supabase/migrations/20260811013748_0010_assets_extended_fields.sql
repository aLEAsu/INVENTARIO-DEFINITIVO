-- Amplia assets con los campos que exige un inventario real (proveedor,
-- factura, costo, catalogos estructurados, trabajador real, baja logica).
-- Las columnas de texto legacy (category/location/area/responsible) NO se
-- borran: quedan como snapshot historico y se usan para generar los
-- catalogos via backfill, sin perder informacion.

alter table public.assets add column if not exists provider text;
alter table public.assets add column if not exists invoice_number text;
alter table public.assets add column if not exists cost numeric;
alter table public.assets add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.assets add column if not exists subcategory_id uuid references public.categories(id) on delete set null;
alter table public.assets add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.assets add column if not exists area_id uuid references public.areas(id) on delete set null;
alter table public.assets add column if not exists worker_id uuid references public.workers(id) on delete set null;
alter table public.assets add column if not exists deleted_at timestamptz;

-- Serial unico por organizacion (permite multiples nulos/vacios).
create unique index if not exists assets_org_serial_idx on public.assets(organization_id, serial)
  where serial is not null and serial <> '';

-- Backfill: generar catalogos a partir de los valores de texto ya
-- existentes y enlazar cada activo. Sin red, todo en SQL puro, por
-- organizacion.
do $$
declare
  r record;
  v_category_id uuid;
  v_location_id uuid;
  v_area_id uuid;
  v_worker_id uuid;
begin
  for r in select id, organization_id, category, location, area, responsible from public.assets loop
    v_category_id := null;
    v_location_id := null;
    v_area_id := null;
    v_worker_id := null;

    if r.category is not null and r.category <> '' then
      select id into v_category_id from public.categories
        where organization_id = r.organization_id and parent_id is null and name = r.category;
      if v_category_id is null then
        insert into public.categories (organization_id, name) values (r.organization_id, r.category)
          returning id into v_category_id;
      end if;
    end if;

    if r.location is not null and r.location <> '' then
      select id into v_location_id from public.locations
        where organization_id = r.organization_id and name = r.location;
      if v_location_id is null then
        insert into public.locations (organization_id, name) values (r.organization_id, r.location)
          returning id into v_location_id;
      end if;
    end if;

    if r.area is not null and r.area <> '' then
      select id into v_area_id from public.areas
        where organization_id = r.organization_id and name = r.area;
      if v_area_id is null then
        insert into public.areas (organization_id, name) values (r.organization_id, r.area)
          returning id into v_area_id;
      end if;
    end if;

    if r.responsible is not null and r.responsible <> '' then
      select id into v_worker_id from public.workers
        where organization_id = r.organization_id and full_name = r.responsible;
      if v_worker_id is null then
        insert into public.workers (organization_id, full_name) values (r.organization_id, r.responsible)
          returning id into v_worker_id;
      end if;
    end if;

    update public.assets
      set category_id = v_category_id, location_id = v_location_id, area_id = v_area_id, worker_id = v_worker_id
      where id = r.id;
  end loop;
end $$;
