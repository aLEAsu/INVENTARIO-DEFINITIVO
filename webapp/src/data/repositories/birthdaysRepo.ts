import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type BirthdayEntry = Tables<'worker_birthday_calendar'>

export async function listBirthdays(organizationId: string): Promise<BirthdayEntry[]> {
  const { data, error } = await supabase
    .from('worker_birthday_calendar')
    .select('*')
    .eq('organization_id', organizationId)
  if (error) throw error
  return data ?? []
}
