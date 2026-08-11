import { supabase } from '../../core/supabaseClient'
import { db, type AssetRecord, findUnassignedRecords, reassignRecordOrganization } from '../db'
import type { Tables } from '../database.types'

export interface AssetInput {
  name: string
  code: string
  category: string
  status: string
  brand?: string
  model?: string
  serial?: string
  tag?: string
  location?: string
  area?: string
  responsible?: string
  condition?: string
  acquisitionDate?: string
  warrantyUntil?: string
  notes?: string
}

function newId(): string {
  return crypto.randomUUID()
}

function mapRowToRecord(row: Tables<'assets'>): AssetRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    category: row.category,
    status: row.status,
    brand: row.brand,
    model: row.model,
    serial: row.serial,
    tag: row.tag,
    location: row.location,
    area: row.area,
    responsible: row.responsible,
    condition: row.condition,
    acquisitionDate: row.acquisitionDate,
    warrantyUntil: row.warrantyUntil,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toSupabasePayload(record: AssetRecord) {
  return {
    id: record.id,
    organization_id: record.organizationId,
    name: record.name,
    code: record.code,
    category: record.category,
    status: record.status,
    brand: record.brand ?? null,
    model: record.model ?? null,
    serial: record.serial ?? null,
    tag: record.tag ?? null,
    location: record.location ?? null,
    area: record.area ?? null,
    responsible: record.responsible ?? null,
    condition: record.condition ?? null,
    acquisitionDate: record.acquisitionDate ?? null,
    warrantyUntil: record.warrantyUntil ?? null,
    notes: record.notes ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

async function enqueue(action: 'upsert' | 'delete', record: AssetRecord) {
  await db.outbox.put({
    id: newId(),
    action,
    table: 'assets',
    record: record as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  })
}

async function pushOrQueue(action: 'upsert' | 'delete', record: AssetRecord) {
  if (!navigator.onLine) {
    await enqueue(action, record)
    return
  }
  try {
    if (action === 'delete') {
      const { error } = await supabase.from('assets').delete().eq('id', record.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('assets').upsert(toSupabasePayload(record))
      if (error) throw error
    }
  } catch {
    await enqueue(action, record)
  }
}

/** Reasigna al local repair los activos legacy migrados sin organizationId. */
export async function repairLegacyAssets(organizationId: string): Promise<number> {
  const orphans = await findUnassignedRecords('assets')
  for (const orphan of orphans) {
    await reassignRecordOrganization('assets', orphan.id as string, organizationId)
    const record = { ...(orphan as unknown as AssetRecord), organizationId }
    await pushOrQueue('upsert', record)
  }
  return orphans.length
}

export async function listAssets(organizationId: string): Promise<AssetRecord[]> {
  if (navigator.onLine) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('createdAt', { ascending: false })

    if (!error && data) {
      const mapped = data.map(mapRowToRecord)
      await db.assets.bulkPut(mapped)
      return mapped
    }
  }

  const cached = await db.assets.where('organizationId').equals(organizationId).sortBy('createdAt')
  return cached.reverse()
}

export async function isCodeTaken(organizationId: string, code: string, excludeId?: string): Promise<boolean> {
  const matches = await db.assets.where('organizationId').equals(organizationId).and((a) => a.code === code).toArray()
  return matches.some((a) => a.id !== excludeId)
}

export async function createAsset(organizationId: string, input: AssetInput): Promise<AssetRecord> {
  const now = new Date().toISOString()
  const record: AssetRecord = { id: newId(), organizationId, createdAt: now, updatedAt: now, ...input }
  await db.assets.put(record)
  await pushOrQueue('upsert', record)
  return record
}

export async function updateAsset(existing: AssetRecord, patch: Partial<AssetInput>): Promise<AssetRecord> {
  const record: AssetRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  await db.assets.put(record)
  await pushOrQueue('upsert', record)
  return record
}

export async function deleteAsset(record: AssetRecord): Promise<void> {
  await db.assets.delete(record.id)
  await pushOrQueue('delete', record)
}

export async function syncOutbox(): Promise<{ processed: number; pending: number; error?: string }> {
  if (!navigator.onLine) return { processed: 0, pending: await db.outbox.count() }

  const jobs = await db.outbox.orderBy('createdAt').toArray()
  let processed = 0

  for (const job of jobs) {
    try {
      if (job.action === 'delete') {
        const { error } = await supabase.from(job.table).delete().eq('id', job.record.id as string)
        if (error) throw error
      } else if (job.table === 'assets') {
        const { error } = await supabase.from('assets').upsert(toSupabasePayload(job.record as unknown as AssetRecord))
        if (error) throw error
      }
      await db.outbox.delete(job.id)
      processed++
    } catch (err) {
      return {
        processed,
        pending: await db.outbox.count(),
        error: err instanceof Error ? err.message : 'Error de sincronizacion',
      }
    }
  }

  return { processed, pending: 0 }
}
