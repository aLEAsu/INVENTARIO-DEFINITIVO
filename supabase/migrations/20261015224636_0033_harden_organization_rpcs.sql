-- Supabase otorga EXECUTE a anon/authenticated por defecto a cualquier
-- funcion nueva en el schema public (via ALTER DEFAULT PRIVILEGES del
-- proyecto), sin importar "revoke all from public" hecho en la migracion
-- que crea la funcion -- ese revoke solo afecta lo heredado via PUBLIC,
-- no el grant directo que Supabase ya aplico al crearla. El linter de
-- seguridad lo marco: anon (no autenticado) podia invocar ambas funciones.
--
-- Doble correccion: se revoca EXECUTE de anon explicitamente, y ademas
-- cada funcion valida auth.uid() is not null por si el grant por defecto
-- se reaplica en el futuro (defensa en profundidad, no solo el GRANT).

revoke execute on function public.create_organization(text) from anon;
revoke execute on function public.apply_blueprint_to_organization(uuid, uuid) from anon;

create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para crear un trabajo';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'El nombre de la organizacion no puede estar vacio';
  end if;

  insert into public.organizations (name) values (btrim(p_name)) returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

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
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para aplicar un blueprint';
  end if;

  if not private.has_org_role(p_org_id, array['owner','admin_ti']) then
    raise exception 'No tienes permiso para aplicar un blueprint a esta organizacion';
  end if;

  select definition, name into v_def, v_name
  from public.trade_blueprints
  where id = p_blueprint_id and (is_system or owner_user_id = auth.uid());

  if v_def is null then
    raise exception 'Blueprint no encontrado o sin acceso';
  end if;

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
