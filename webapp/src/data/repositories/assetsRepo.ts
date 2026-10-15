import { supabase } from '../../core/supabaseClient'
import { db, type AssetRecord, findUnassignedRecords, reassignRecordOrganization } from '../db'
import type { Tables } from '../database.types'

export interface AssetInput {
  name: string
  code: string
  category: string
  categoryId?: string | null
  subcategoryId?: string | null
  status: string
  brand?: string
  model?: string
  serial?: string
  tag?: string
  location?: string
  locationId?: string | null
  area?: string
  areaId?: string | null
  responsible?: string
  workerId?: string | null
  condition?: string
  acquisitionDate?: string
  warrantyUntil?: string
  notes?: string
  provider?: string
  invoiceNumber?: string
  cost?: number | null
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
    provider: row.provider,
    invoiceNumber: row.invoice_number,
    cost: row.cost,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    locationId: row.location_id,
    areaId: row.area_id,
    workerId: row.worker_id,
    deletedAt: row.deleted_at,
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
    acquisitionDate: record.acquisitionDate?.trim() ? record.acquisitionDate : null,
    warrantyUntil: record.warrantyUntil?.trim() ? record.warrantyUntil : null,
    notes: record.notes ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    provider: record.provider ?? null,
    invoice_number: record.invoiceNumber ?? null,
    cost: record.cost ?? null,
    category_id: record.categoryId ?? null,
    subcategory_id: record.subcategoryId ?? null,
    location_id: record.locationId ?? null,
    area_id: record.areaId ?? null,
    worker_id: record.workerId ?? null,
    deleted_at: record.deletedAt ?? null,
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

/** Errores devueltos por Postgres/PostgREST (constraint, RLS, etc.) traen un
 * campo `code` -- son permanentes, reintentarlos en el outbox nunca los
 * resuelve. Los fallos de red genuinos (offline, timeout) no tienen ese
 * campo y sí vale la pena reintentarlos mas tarde. */
function isPermanentError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err
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
  } catch (err) {
    if (isPermanentError(err)) throw err
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

/** Lista activos NO dados de baja de la organizacion (mas recientes primero). */
export async function listAssets(organizationId: string): Promise<AssetRecord[]> {
  if (navigator.onLine) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('createdAt', { ascending: false })

    if (!error && data) {
      const mapped = data.map(mapRowToRecord)
      await db.assets.bulkPut(mapped)
      return mapped
    }
  }

  const cached = await db.assets.where('organizationId').equals(organizationId).sortBy('createdAt')
  return cached.reverse().filter((a) => !a.deletedAt)
}

export async function getAsset(id: string): Promise<AssetRecord | undefined> {
  if (navigator.onLine) {
    const { data, error } = await supabase.from('assets').select('*').eq('id', id).maybeSingle()
    if (!error && data) {
      const record = mapRowToRecord(data)
      await db.assets.put(record)
      return record
    }
  }
  return db.assets.get(id)
}

export async function isCodeTaken(organizationId: string, code: string, excludeId?: string): Promise<boolean> {
  const matches = await db.assets.where('organizationId').equals(organizationId).and((a) => a.code === code).toArray()
  return matches.some((a) => a.id !== excludeId)
}

export async function isSerialTaken(organizationId: string, serial: string, excludeId?: string): Promise<boolean> {
  if (!serial.trim()) return false
  const matches = await db.assets
    .where('organizationId')
    .equals(organizationId)
    .and((a) => (a.serial ?? '') === serial)
    .toArray()
  return matches.some((a) => a.id !== excludeId)
}

export async function createAsset(organizationId: string, input: AssetInput): Promise<AssetRecord> {
  const now = new Date().toISOString()
  const record: AssetRecord = { id: newId(), organizationId, createdAt: now, updatedAt: now, ...input }
  await db.assets.put(record)
  try {
    await pushOrQueue('upsert', record)
  } catch (err) {
    // Error permanente (constraint/RLS): no dejar en cache local un
    // registro que nunca va a sincronizar y que el usuario veria como
    // "guardado" sin estarlo realmente.
    await db.assets.delete(record.id)
    throw err
  }
  return record
}

export async function updateAsset(existing: AssetRecord, patch: Partial<AssetInput>): Promise<AssetRecord> {
  const record: AssetRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  await db.assets.put(record)
  try {
    await pushOrQueue('upsert', record)
  } catch (err) {
    await db.assets.put(existing)
    throw err
  }
  return record
}

/** Baja logica: preserva el registro y su trazabilidad (historial, auditoria). */
export async function softDeleteAsset(record: AssetRecord): Promise<AssetRecord> {
  const updated: AssetRecord = { ...record, status: 'baja', deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  await db.assets.put(updated)
  try {
    await pushOrQueue('upsert', updated)
  } catch (err) {
    await db.assets.put(record)
    throw err
  }
  return updated
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
