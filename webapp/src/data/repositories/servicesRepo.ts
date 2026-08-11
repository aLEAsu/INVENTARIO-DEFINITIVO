import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type Service = Tables<'services'>
export type IncidentCategory = Tables<'incident_categories'>

export async function listServices(organizationId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createService(organizationId: string, name: string, description: string | null): Promise<void> {
  const { error } = await supabase.from('services').insert({ organization_id: organizationId, name, description })
  if (error) throw error
}

export async function listIncidentCategories(organizationId: string): Promise<IncidentCategory[]> {
  const { data, error } = await supabase
    .from('incident_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data ?? []
}
