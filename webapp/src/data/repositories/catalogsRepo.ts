import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type Site = Tables<'sites'>
export type Location = Tables<'locations'>
export type Area = Tables<'areas'>
export type Category = Tables<'categories'>

async function listActive<T extends { deleted_at: string | null }>(
  table: 'sites' | 'locations' | 'areas' | 'categories',
  organizationId: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return (data ?? []) as unknown as T[]
}

export const listSites = (organizationId: string) => listActive<Site>('sites', organizationId)
export const listLocations = (organizationId: string) => listActive<Location>('locations', organizationId)
export const listAreas = (organizationId: string) => listActive<Area>('areas', organizationId)
export const listCategories = (organizationId: string) => listActive<Category>('categories', organizationId)

export async function createSite(organizationId: string, input: { name: string; address?: string | null }) {
  const { data, error } = await supabase
    .from('sites')
    .insert({ organization_id: organizationId, name: input.name, address: input.address ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createLocation(
  organizationId: string,
  input: { name: string; site_id?: string | null },
) {
  const { data, error } = await supabase
    .from('locations')
    .insert({ organization_id: organizationId, name: input.name, site_id: input.site_id ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createArea(organizationId: string, input: { name: string }) {
  const { data, error } = await supabase
    .from('areas')
    .insert({ organization_id: organizationId, name: input.name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createCategory(
  organizationId: string,
  input: { name: string; parent_id?: string | null },
) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ organization_id: organizationId, name: input.name, parent_id: input.parent_id ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteCatalogEntry(
  table: 'sites' | 'locations' | 'areas' | 'categories',
  id: string,
) {
  const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
