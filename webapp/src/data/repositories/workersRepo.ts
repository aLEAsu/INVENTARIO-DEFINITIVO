import { supabase } from '../../core/supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from '../database.types'

export type Worker = Tables<'workers'>
export type WorkerInput = Omit<TablesInsert<'workers'>, 'organization_id' | 'id'>

export async function listWorkers(organizationId: string): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('full_name')
  if (error) throw error
  return data ?? []
}

export async function createWorker(organizationId: string, input: WorkerInput): Promise<Worker> {
  const { data, error } = await supabase
    .from('workers')
    .insert({ ...input, organization_id: organizationId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorker(id: string, patch: TablesUpdate<'workers'>): Promise<Worker> {
  const { data, error } = await supabase.from('workers').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function softDeleteWorker(id: string): Promise<void> {
  const { error } = await supabase.from('workers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
