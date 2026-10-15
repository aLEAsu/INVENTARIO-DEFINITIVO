import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type TradeBlueprint = Tables<'trade_blueprints'>

/** Blueprints visibles para el usuario actual: los de sistema (compartidos)
 * mas los personales que haya guardado. RLS ya filtra por dueno/sistema. */
export async function listAvailableBlueprints(): Promise<TradeBlueprint[]> {
  const { data, error } = await supabase
    .from('trade_blueprints')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name')
  if (error) throw error
  return data ?? []
}

/** Aplica un blueprint (categorias, campos personalizados, categorias de
 * incidente) a una organizacion recien creada o existente. Requiere ser
 * owner/admin_ti de esa organizacion (validado tambien en el backend). */
export async function applyBlueprintToOrganization(organizationId: string, blueprintId: string) {
  const { error } = await supabase.rpc('apply_blueprint_to_organization', {
    p_org_id: organizationId,
    p_blueprint_id: blueprintId,
  })
  if (error) throw error
}
