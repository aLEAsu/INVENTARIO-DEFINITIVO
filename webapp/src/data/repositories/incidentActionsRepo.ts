import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type IncidentAction = Tables<'incident_actions'>

export async function listIncidentActions(incidentId: string): Promise<IncidentAction[]> {
  const { data, error } = await supabase
    .from('incident_actions')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createIncidentAction(
  organizationId: string,
  incidentId: string,
  input: { type: 'preventiva' | 'correctiva'; description: string; responsible: string | null; due_date: string | null },
): Promise<void> {
  const { error } = await supabase
    .from('incident_actions')
    .insert({ organization_id: organizationId, incident_id: incidentId, ...input })
  if (error) throw error
}

export async function completeIncidentAction(id: string): Promise<void> {
  const { error } = await supabase.from('incident_actions').update({ status: 'completada' }).eq('id', id)
  if (error) throw error
}
