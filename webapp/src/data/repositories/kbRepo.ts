import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type KbArticle = Tables<'kb_articles'>

export async function listKbArticles(organizationId: string): Promise<KbArticle[]> {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createKbArticle(
  organizationId: string,
  input: { title: string; category: string | null; content: string; related_incident_id: string | null },
  createdBy: string | null,
): Promise<void> {
  const { error } = await supabase.from('kb_articles').insert({ organization_id: organizationId, ...input, created_by: createdBy })
  if (error) throw error
}

export async function updateKbArticle(id: string, patch: { title?: string; category?: string | null; content?: string }): Promise<void> {
  const { error } = await supabase.from('kb_articles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
