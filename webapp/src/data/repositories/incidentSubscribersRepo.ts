import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type IncidentSubscriber = Tables<'incident_subscribers'>

export async function getMySubscription(incidentId: string, userId: string): Promise<IncidentSubscriber | null> {
  const { data, error } = await supabase
    .from('incident_subscribers')
    .select('*')
    .eq('incident_id', incidentId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function subscribe(organizationId: string, incidentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('incident_subscribers')
    .upsert({ organization_id: organizationId, incident_id: incidentId, user_id: userId, last_seen_at: new Date().toISOString() })
  if (error) throw error
}

export async function unsubscribe(incidentId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('incident_subscribers').delete().eq('incident_id', incidentId).eq('user_id', userId)
  if (error) throw error
}
