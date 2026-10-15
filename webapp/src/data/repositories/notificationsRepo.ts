import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type NotificationSettings = Tables<'organization_notification_settings'>
export type Recipient = Tables<'birthday_notification_recipients'>
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

export async function createRecipient(
  organizationId: string,
  phoneE164: string,
  label: string | null,
  callmebotApikey: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('birthday_notification_recipients')
    .insert({ organization_id: organizationId, phone_e164: phoneE164, label, callmebot_apikey: callmebotApikey })
  if (error) throw error
}

export async function toggleRecipient(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('birthday_notification_recipients').update({ active }).eq('id', id)
  if (error) throw error
}

export async function updateRecipientApikey(id: string, callmebotApikey: string | null): Promise<void> {
  const { error } = await supabase.from('birthday_notification_recipients').update({ callmebot_apikey: callmebotApikey }).eq('id', id)
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
