import { supabase } from '../../core/supabaseClient'
import type { Tables, TablesInsert } from '../database.types'

export type MaintenanceRecord = Tables<'maintenance'>
export type MaintenanceInput = Omit<TablesInsert<'maintenance'>, 'organization_id' | 'id' | 'user_id'>

export async function listMaintenanceForAsset(assetId: string): Promise<MaintenanceRecord[]> {
  const { data, error } = await supabase
    .from('maintenance')
    .select('*')
    .eq('assetId', assetId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listMaintenance(organizationId: string): Promise<MaintenanceRecord[]> {
  const { data, error } = await supabase
    .from('maintenance')
    .select('*')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createMaintenance(organizationId: string, input: MaintenanceInput): Promise<MaintenanceRecord> {
  const { data, error } = await supabase
    .from('maintenance')
    .insert({ ...input, organization_id: organizationId })
    .select()
    .single()
  if (error) throw error

  // Un mantenimiento no completado marca el activo como "en mantenimiento".
  if (input.status !== 'completado') {
    await supabase.from('assets').update({ status: 'mantenimiento' }).eq('id', input.assetId)
  }

  return data
}

export async function updateMaintenanceStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('maintenance').update({ status }).eq('id', id)
  if (error) throw error
}
