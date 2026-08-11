import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type IncidentUpdate = Tables<'incident_updates'>

export async function listIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]> {
  const { data, error } = await supabase
    .from('incident_updates')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addComment(
  organizationId: string,
  incidentId: string,
  comment: string,
  visibility: 'interno' | 'publico',
  authorId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('incident_updates')
    .insert({ organization_id: organizationId, incident_id: incidentId, comment, visibility, author_id: authorId })
  if (error) throw error
}
