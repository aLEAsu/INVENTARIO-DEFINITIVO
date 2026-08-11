import { supabase } from '../../core/supabaseClient'
import type { Tables } from '../database.types'

export type Attachment = Tables<'attachments'>
export type AttachmentEntityType = 'asset' | 'maintenance' | 'physical_count'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function listAttachments(entityType: AttachmentEntityType, entityId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function uploadAttachment(
  organizationId: string,
  entityType: AttachmentEntityType,
  entityId: string,
  file: File,
  uploadedBy: string | null,
): Promise<Attachment> {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('El archivo supera el tamano maximo permitido (10 MB).')
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido. Usa JPG, PNG, WEBP o PDF.')
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${organizationId}/${entityType}/${entityId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_id: entityId,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAttachmentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('attachments').createSignedUrl(filePath, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  await supabase.storage.from('attachments').remove([attachment.file_path])
  const { error } = await supabase.from('attachments').delete().eq('id', attachment.id)
  if (error) throw error
}
