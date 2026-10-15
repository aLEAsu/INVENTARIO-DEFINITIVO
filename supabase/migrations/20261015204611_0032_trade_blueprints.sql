-- Blueprints de oficio: paquetes reutilizables de configuracion (categorias,
-- campos personalizados, categorias de incidente) que el ingeniero aplica al
-- crear un trabajo (organizacion) nuevo, en vez de configurar todo desde cero.
-- Un blueprint "de sistema" (is_system = true, owner_user_id null) viene
-- sembrado por defecto y es visible para cualquier usuario autenticado; un
-- blueprint personal solo es visible/editable por su dueno.

create table if not exists public.trade_blueprints (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  trade text,
  description text,
  definition jsonb not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_system = false or owner_user_id is null)
);

create table if not exists public.organization_blueprint_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  blueprint_id uuid references public.trade_blueprints(id) on delete set null,
  blueprint_name_snapshot text not null,
  applied_by uuid references auth.users(id),
  applied_at timestamptz not null default now()
);

create index if not exists trade_blueprints_owner_idx on public.trade_blueprints(owner_user_id);
create index if not exists org_blueprint_applications_org_idx on public.organization_blueprint_applications(organization_id);

alter table public.trade_blueprints enable row level security;
alter table public.organization_blueprint_applications enable row level security;

drop policy if exists "trade_blueprints_read" on public.trade_blueprints;
create policy "trade_blueprints_read" on public.trade_blueprints for select
  using (is_system or owner_user_id = auth.uid());

drop policy if exists "trade_blueprints_write" on public.trade_blueprints;
create policy "trade_blueprints_write" on public.trade_blueprints for all
  using (owner_user_id = auth.uid() and not is_system)
  with check (owner_user_id = auth.uid() and not is_system);

drop policy if exists "org_blueprint_applications_read" on public.organization_blueprint_applications;
create policy "org_blueprint_applications_read" on public.organization_blueprint_applications for select
  using (private.is_org_member(organization_id));

-- Solo apply_blueprint_to_organization (security definer) inserta aqui.

create or replace function public.apply_blueprint_to_organization(p_org_id uuid, p_blueprint_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_def jsonb;
  v_name text;
  v_cat jsonb;
  v_parent_id uuid;
  v_sub text;
  v_field jsonb;
  v_entity text;
  v_incident_cat text;
begin
  if not private.has_org_role(p_org_id, array['owner','admin_ti']) then
    raise exception 'No tienes permiso para aplicar un blueprint a esta organizacion';
  end if;

  select definition, name into v_def, v_name
  from public.trade_blueprints
  where id = p_blueprint_id and (is_system or owner_user_id = auth.uid());

  if v_def is null then
    raise exception 'Blueprint no encontrado o sin acceso';
  end if;

  -- Categorias y subcategorias. Se evita depender de ON CONFLICT sobre
  -- (organization_id, parent_id, name) porque parent_id NULL (categorias de
  -- primer nivel) nunca se considera "igual" a otro NULL para un constraint
  -- UNIQUE estandar, asi que se verifica existencia explicitamente.
  for v_cat in select jsonb_array_elements(coalesce(v_def->'categories', '[]'::jsonb))
  loop
    select id into v_parent_id from public.categories
    where organization_id = p_org_id and parent_id is null and name = v_cat->>'name' and deleted_at is null;

    if v_parent_id is null then
      insert into public.categories (organization_id, name)
      values (p_org_id, v_cat->>'name')
      returning id into v_parent_id;
    end if;

    for v_sub in select jsonb_array_elements_text(coalesce(v_cat->'subcategories', '[]'::jsonb))
    loop
      if not exists (
        select 1 from public.categories
        where organization_id = p_org_id and parent_id = v_parent_id and name = v_sub and deleted_at is null
      ) then
        insert into public.categories (organization_id, parent_id, name)
        values (p_org_id, v_parent_id, v_sub);
      end if;
    end loop;
  end loop;

  -- Campos personalizados por tipo de entidad.
  for v_entity in select jsonb_object_keys(coalesce(v_def->'custom_fields', '{}'::jsonb))
  loop
    for v_field in select jsonb_array_elements(v_def->'custom_fields'->v_entity)
    loop
      insert into public.custom_field_definitions
        (organization_id, entity_type, key, label, field_type, options, required, sort_order)
      values (
        p_org_id, v_entity,
        v_field->>'key', v_field->>'label', v_field->>'field_type',
        v_field->'options',
        coalesce((v_field->>'required')::boolean, false),
        coalesce((v_field->>'sort_order')::integer, 0)
      )
      on conflict (organization_id, entity_type, key) do nothing;
    end loop;
  end loop;

  -- Categorias de incidente (unique(organization_id, name), sin columnas nulas).
  for v_incident_cat in select jsonb_array_elements_text(coalesce(v_def->'incident_categories', '[]'::jsonb))
  loop
    insert into public.incident_categories (organization_id, name)
    values (p_org_id, v_incident_cat)
    on conflict (organization_id, name) do nothing;
  end loop;

  insert into public.organization_blueprint_applications (organization_id, blueprint_id, blueprint_name_snapshot, applied_by)
  values (p_org_id, p_blueprint_id, v_name, auth.uid());
end;
$$;

revoke all on function public.apply_blueprint_to_organization(uuid, uuid) from public;
grant execute on function public.apply_blueprint_to_organization(uuid, uuid) to authenticated;

-- Blueprint de sistema: generico, minimo, aplicable a cualquier rubro tecnico.
insert into public.trade_blueprints (name, trade, description, definition, is_system)
select 'Generico', 'generico',
  'Punto de partida minimo: categorias y campos basicos aplicables a cualquier rubro tecnico.',
  '{
    "categories": [
      {"name": "Equipos", "subcategories": ["Principal", "Repuesto"]},
      {"name": "Herramientas", "subcategories": []},
      {"name": "Consumibles", "subcategories": []}
    ],
    "custom_fields": {
      "asset": [
        {"key": "numero_serie_fabricante", "label": "Numero de serie del fabricante", "field_type": "text", "required": false}
      ],
      "incident": [],
      "worker": []
    },
    "incident_categories": ["Falla de equipo", "Mantenimiento preventivo", "Solicitud", "Otras"]
  }'::jsonb,
  true
where not exists (select 1 from public.trade_blueprints where name = 'Generico' and is_system);

-- Blueprint de sistema: IT / Oficina, reconstruido a partir de la configuracion
-- real de UNOP (primera organizacion del sistema), para no inventar un rubro
-- sin validar contra un caso de uso real.
do $$
declare
  v_org_id uuid;
  v_categories jsonb;
  v_incident_cats jsonb;
begin
  select id into v_org_id from public.organizations where name = 'UNOP' limit 1;
  if v_org_id is not null and not exists (select 1 from public.trade_blueprints where name = 'IT / Oficina' and is_system) then
    select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'subcategories', coalesce(p.subs, '[]'::jsonb))), '[]'::jsonb)
    into v_categories
    from (
      select par.name, jsonb_agg(sub.name) filter (where sub.name is not null) as subs
      from public.categories par
      left join public.categories sub on sub.parent_id = par.id and sub.deleted_at is null
      where par.organization_id = v_org_id and par.parent_id is null and par.deleted_at is null
      group by par.name
    ) p;

    select coalesce(jsonb_agg(name), '[]'::jsonb) into v_incident_cats
    from public.incident_categories where organization_id = v_org_id and deleted_at is null;

    insert into public.trade_blueprints (name, trade, description, definition, is_system)
    values (
      'IT / Oficina', 'it_oficina',
      'Basado en la configuracion real usada por UNOP: inventario de computadores, perifericos y equipos de oficina.',
      jsonb_build_object(
        'categories', v_categories,
        'custom_fields', jsonb_build_object('asset','[]'::jsonb,'incident','[]'::jsonb,'worker','[]'::jsonb),
        'incident_categories', v_incident_cats
      ),
      true
    );
  end if;
end $$;
