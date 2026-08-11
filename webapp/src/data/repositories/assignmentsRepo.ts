import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type AssetAssignment = Tables<'asset_assignments'>

export async function listAssignmentsForAsset(assetId: string): Promise<AssetAssignment[]> {
  const { data, error } = await supabase
    .from('asset_assignments')
    .select('*')
    .eq('asset_id', assetId)
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function assignAssetToWorker(
  organizationId: string,
  assetId: string,
  workerId: string,
  notes: string | null,
  assignedBy: string | null,
): Promise<void> {
  // Cierra cualquier asignacion abierta antes de abrir una nueva (un activo
  // solo puede estar asignado a una persona a la vez).
  await supabase
    .from('asset_assignments')
    .update({ returned_at: new Date().toISOString() })
    .eq('asset_id', assetId)
    .is('returned_at', null)

  const { error } = await supabase.from('asset_assignments').insert({
    organization_id: organizationId,
    asset_id: assetId,
    worker_id: workerId,
    notes,
    assigned_by: assignedBy,
  })
  if (error) throw error

  await supabase.from('assets').update({ status: 'asignado', worker_id: workerId }).eq('id', assetId)
}

export async function returnAsset(assetId: string, assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('asset_assignments')
    .update({ returned_at: new Date().toISOString() })
    .eq('id', assignmentId)
  if (error) throw error

  await supabase.from('assets').update({ status: 'activo', worker_id: null }).eq('id', assetId)
}
