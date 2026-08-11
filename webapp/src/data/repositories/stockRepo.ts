import { supabase } from '../../core/supabaseClient'
import type { Tables, TablesInsert } from '../database.types'

export type InventoryItem = Tables<'inventory_items'>
export type StockMovement = Tables<'stock_movements'>
export type InventoryItemInput = Omit<TablesInsert<'inventory_items'>, 'organization_id' | 'id'>

export async function listInventoryItems(organizationId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function createInventoryItem(organizationId: string, input: InventoryItemInput): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...input, organization_id: organizationId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listStockMovements(organizationId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('organization_id', organizationId)
    .order('movement_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function registerStockMovement(
  organizationId: string,
  input: { item_id: string; type: 'entrada' | 'salida'; quantity: number; reason: string | null; createdBy: string | null },
): Promise<void> {
  const { error } = await supabase.from('stock_movements').insert({
    organization_id: organizationId,
    item_id: input.item_id,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    created_by: input.createdBy,
  })
  if (error) throw error
}

/** Stock actual por item = entradas - salidas, calculado a partir de los movimientos. */
export function computeStockByItem(movements: StockMovement[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const m of movements) {
    const delta = m.type === 'entrada' ? m.quantity : -m.quantity
    totals[m.item_id] = (totals[m.item_id] ?? 0) + delta
  }
  return totals
}
