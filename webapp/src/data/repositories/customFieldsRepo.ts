import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type CustomFieldDefinition = Tables<'custom_field_definitions'>
export type CustomFieldValue = Tables<'custom_field_values'>
export type CustomFieldEntityType = CustomFieldDefinition['entity_type']

export async function listFieldDefinitions(
  organizationId: string,
  entityType: CustomFieldEntityType,
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .is('deleted_at', null)
    .order('sort_order')
    .order('label')
  if (error) throw error
  return data ?? []
}

export async function createFieldDefinition(
  organizationId: string,
  input: {
    entityType: CustomFieldEntityType
    key: string
    label: string
    fieldType: CustomFieldDefinition['field_type']
    options?: string[] | null
    required?: boolean
  },
) {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert({
      organization_id: organizationId,
      entity_type: input.entityType,
      key: input.key,
      label: input.label,
      field_type: input.fieldType,
      options: input.options ?? null,
      required: input.required ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteFieldDefinition(id: string) {
  const { error } = await supabase
    .from('custom_field_definitions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Valores de campos personalizados de una entidad puntual, indexados por field_id. */
export async function listValuesForEntity(
  organizationId: string,
  entityType: CustomFieldEntityType,
  entityId: string,
): Promise<Map<string, CustomFieldValue>> {
  const { data, error } = await supabase
    .from('custom_field_values')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
  if (error) throw error
  return new Map((data ?? []).map((v) => [v.field_id, v]))
}

/** Reemplaza (upsert) el valor de un campo personalizado para una entidad. Un
 * value null/vacio borra el valor guardado en vez de dejar una fila vacia. */
export async function setFieldValue(
  organizationId: string,
  entityType: CustomFieldEntityType,
  entityId: string,
  fieldId: string,
  value: unknown,
) {
  const isEmpty = value === null || value === undefined || value === ''
  if (isEmpty) {
    const { error } = await supabase
      .from('custom_field_values')
      .delete()
      .eq('field_id', fieldId)
      .eq('entity_id', entityId)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('custom_field_values')
    .upsert(
      { organization_id: organizationId, entity_type: entityType, entity_id: entityId, field_id: fieldId, value: value as never },
      { onConflict: 'field_id,entity_id' },
    )
  if (error) throw error
}
