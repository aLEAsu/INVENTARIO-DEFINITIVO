import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type PhysicalCount = Tables<'physical_counts'>
export type PhysicalCountItem = Tables<'physical_count_items'>

export async function getOpenCount(organizationId: string): Promise<PhysicalCount | null> {
  const { data, error } = await supabase
    .from('physical_counts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'abierto')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listClosedCounts(organizationId: string): Promise<PhysicalCount[]> {
  const { data, error } = await supabase
    .from('physical_counts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'cerrado')
    .order('closed_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function openCount(
  organizationId: string,
  scopeLocationId: string | null,
  openedBy: string | null,
): Promise<PhysicalCount> {
  const { data: count, error } = await supabase
    .from('physical_counts')
    .insert({ organization_id: organizationId, scope_location_id: scopeLocationId, opened_by: openedBy })
    .select()
    .single()
  if (error) throw error

  let assetsQuery = supabase.from('assets').select('id').eq('organization_id', organizationId).is('deleted_at', null)
  if (scopeLocationId) assetsQuery = assetsQuery.eq('location_id', scopeLocationId)
  const { data: assets, error: assetsError } = await assetsQuery
  if (assetsError) throw assetsError

  if (assets && assets.length > 0) {
    const items = assets.map((a) => ({ physical_count_id: count.id, asset_id: a.id, expected: true, found: false }))
    const { error: itemsError } = await supabase.from('physical_count_items').insert(items)
    if (itemsError) throw itemsError
  }

  return count
}

export async function listCountItems(countId: string): Promise<(PhysicalCountItem & { assetCode?: string; assetName?: string })[]> {
  const { data, error } = await supabase
    .from('physical_count_items')
    .select('*, assets(code, name)')
    .eq('physical_count_id', countId)
  if (error) throw error
  return (data ?? []).map((row) => {
    const rel = row as unknown as { assets?: { code: string; name: string } | null }
    return { ...row, assetCode: rel.assets?.code, assetName: rel.assets?.name }
  })
}

export async function scanAssetIntoCount(
  countId: string,
  organizationId: string,
  assetCode: string,
  countedBy: string | null,
): Promise<{ ok: boolean; message: string }> {
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, code, name')
    .eq('organization_id', organizationId)
    .eq('code', assetCode)
    .maybeSingle()

  if (assetError) throw assetError
  if (!asset) return { ok: false, message: `Ningún activo con código "${assetCode}" en esta organización.` }

  const { data: existing } = await supabase
    .from('physical_count_items')
    .select('*')
    .eq('physical_count_id', countId)
    .eq('asset_id', asset.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('physical_count_items')
      .update({ found: true, counted_by: countedBy, counted_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { ok: true, message: `${asset.name} (${asset.code}) marcado como encontrado.` }
  }

  const { error } = await supabase.from('physical_count_items').insert({
    physical_count_id: countId,
    asset_id: asset.id,
    expected: false,
    found: true,
    counted_by: countedBy,
    counted_at: new Date().toISOString(),
  })
  if (error) throw error
  return { ok: true, message: `${asset.name} (${asset.code}) encontrado fuera del alcance esperado del conteo.` }
}

export async function closeCount(countId: string, closingNotes: string, closedBy: string | null): Promise<void> {
  const { error } = await supabase
    .from('physical_counts')
    .update({ status: 'cerrado', closing_notes: closingNotes, closed_by: closedBy, closed_at: new Date().toISOString() })
    .eq('id', countId)
  if (error) throw error
}
