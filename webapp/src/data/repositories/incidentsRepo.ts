import { supabase } from '../../core/supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from '../database.types'

export type Incident = Tables<'incidents'>
export type IncidentInput = Omit<TablesInsert<'incidents'>, 'organization_id' | 'id' | 'folio' | 'created_by'>

export async function listIncidents(organizationId: string): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export interface PublicStatusEntry {
  id: string
  folio: string | null
  type: string
  category_id: string | null
  priority: string
  status: string
  created_at: string
  resolved_at: string | null
}

/** Panel de estado para compañeros: solo columnas no sensibles (sin
 * descripcion, causa raiz, comentarios, ni datos de quien reporta). */
export async function listPublicStatusSnapshot(organizationId: string): Promise<PublicStatusEntry[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, folio, type, category_id, priority, status, created_at, resolved_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { data, error } = await supabase.from('incidents').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createIncident(organizationId: string, input: IncidentInput, createdBy: string | null): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({ ...input, organization_id: organizationId, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateIncident(id: string, patch: TablesUpdate<'incidents'>): Promise<Incident> {
  const { data, error } = await supabase.from('incidents').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Cambia el estado y, si corresponde, marca resolved_at/closed_at. Registra el cambio en la bitacora. */
export async function changeIncidentStatus(
  incident: Incident,
  newStatus: string,
  authorId: string | null,
): Promise<Incident> {
  const patch: TablesUpdate<'incidents'> = { status: newStatus }
  if (newStatus === 'resuelto' && !incident.resolved_at) patch.resolved_at = new Date().toISOString()
  if (newStatus === 'cerrado' && !incident.closed_at) patch.closed_at = new Date().toISOString()

  const updated = await updateIncident(incident.id, patch)

  await supabase.from('incident_updates').insert({
    incident_id: incident.id,
    organization_id: incident.organization_id,
    author_id: authorId,
    visibility: 'publico',
    status_from: incident.status,
    status_to: newStatus,
  })

  return updated
}
