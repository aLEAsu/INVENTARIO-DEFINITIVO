-- Permite a un usuario autenticado crear una organizacion (trabajo) nueva y
-- quedar como su owner, en una sola operacion atomica. No se agrega policy
-- de insert directa sobre organizations/organization_members para evitar
-- que un usuario pueda insertarse como miembro de una organizacion ajena;
-- toda la logica vive en esta funcion security definer.
create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'El nombre de la organizacion no puede estar vacio';
  end if;

  insert into public.organizations (name) values (btrim(p_name)) returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

revoke all on function public.create_organization(text) from public;
grant execute on function public.create_organization(text) to authenticated;
