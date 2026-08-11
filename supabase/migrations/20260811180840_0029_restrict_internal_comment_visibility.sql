-- La policy de insert original permitia a cualquier rol con permiso de
-- escritura en incidentes (incluido 'colaborador') marcar su propio
-- comentario como visibility='interno', aunque despues el mismo colaborador
-- no pudiera volver a leerlo (la policy de select de 'interno' ya estaba
-- restringida a owner/admin_ti/tecnico_ti). Se separa en dos policies de
-- insert: una para comentarios publicos (todos los roles con escritura) y
-- otra para comentarios internos (solo roles tecnicos), consistente con la
-- intencion de diseño ya reflejada en la UI (el selector de visibilidad
-- solo se muestra a esos roles).

drop policy if exists "incident_updates_insert" on public.incident_updates;

create policy "incident_updates_insert_publico" on public.incident_updates
  for insert
  with check (
    visibility = 'publico'
    and private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti','colaborador'])
  );

create policy "incident_updates_insert_interno" on public.incident_updates
  for insert
  with check (
    visibility = 'interno'
    and private.has_org_role(organization_id, array['owner','admin_ti','tecnico_ti'])
  );
