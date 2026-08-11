import { supabase } from '../../core/supabaseClient'
import type { Tables, TablesInsert } from '../database.types'

export type NotificationSettings = Tables<'organization_notification_settings'>
export type Recipient = Tables<'birthday_notification_recipients'>
export type Template = Tables<'notification_templates'>
export type Delivery = Tables<'notification_deliveries'>

export async function getSettings(organizationId: string): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('organization_notification_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSettings(
  organizationId: string,
  input: { send_hour_local: number; feb29_policy: string; timezone: string },
): Promise<void> {
  const { error } = await supabase
    .from('organization_notification_settings')
    .upsert({ organization_id: organizationId, ...input })
  if (error) throw error
}

export async function listRecipients(organizationId: string): Promise<Recipient[]> {
  const { data, error } = await supabase
    .from('birthday_notification_recipients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createRecipient(organizationId: string, phoneE164: string, label: string | null): Promise<void> {
  const { error } = await supabase
    .from('birthday_notification_recipients')
    .insert({ organization_id: organizationId, phone_e164: phoneE164, label })
  if (error) throw error
}

export async function toggleRecipient(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('birthday_notification_recipients').update({ active }).eq('id', id)
  if (error) throw error
}

export async function listTemplates(organizationId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createTemplate(
  organizationId: string,
  input: Omit<TablesInsert<'notification_templates'>, 'organization_id' | 'id'>,
): Promise<void> {
  const { error } = await supabase.from('notification_templates').insert({ ...input, organization_id: organizationId })
  if (error) throw error
}

export async function listDeliveries(organizationId: string): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('notification_deliveries')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}
