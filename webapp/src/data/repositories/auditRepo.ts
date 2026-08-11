import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type AuditEntry = Tables<'audit_log'>

export async function listAuditForRecord(tableName: string, recordId: string): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
