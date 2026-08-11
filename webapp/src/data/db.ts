import Dexie, { type Table } from 'dexie'

export interface AssetRecord {
  id: string
  organizationId: string
  name: string
  code: string
  category: string
  status: string
  brand?: string | null
  model?: string | null
  serial?: string | null
  tag?: string | null
  location?: string | null
  area?: string | null
  responsible?: string | null
  condition?: string | null
  acquisitionDate?: string | null
  warrantyUntil?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  provider?: string | null
  invoiceNumber?: string | null
  cost?: number | null
  categoryId?: string | null
  subcategoryId?: string | null
  locationId?: string | null
  areaId?: string | null
  workerId?: string | null
  deletedAt?: string | null
}

export type OutboxTable = 'assets' | 'movements' | 'maintenance' | 'catalogs'

export interface OutboxJob {
  id: string
  action: 'upsert' | 'delete'
  table: OutboxTable
  record: Record<string, unknown>
  createdAt: string
}

const LEGACY_DATA_STORES = ['assets', 'movements', 'maintenance', 'catalogs'] as const

/**
 * Base local IndexedDB. Mantiene el mismo nombre que la app legacy
 * (unop-activo-db) para heredar los datos ya guardados en el navegador del
 * usuario. La v1 replica el esquema legacy tal cual (sin indices, keyPath
 * 'id') para poder abrir bases existentes; la v2 agrega indices y una
 * columna organizationId a cada registro.
 *
 * El upgrade NO hace llamadas de red (una transaccion de IndexedDB no debe
 * esperar operaciones externas): a los registros legacy sin organizationId
 * se les asigna el sentinel '' y quedan pendientes de "reparacion" -- ver
 * repairLegacyRecords() en repositories/, que corre una vez resuelta la
 * organizacion activa tras el login.
 */
export class UnopDb extends Dexie {
  assets!: Table<AssetRecord, string>
  movements!: Table<Record<string, unknown>, string>
  maintenance!: Table<Record<string, unknown>, string>
  catalogs!: Table<Record<string, unknown>, string>
  outbox!: Table<OutboxJob, string>
  settings!: Table<Record<string, unknown>, string>

  constructor() {
    super('unop-activo-db')

    this.version(1).stores({
      assets: 'id',
      movements: 'id',
      maintenance: 'id',
      catalogs: 'id',
      outbox: 'id',
      settings: 'id',
    })

    this.version(2)
      .stores({
        assets: 'id, organizationId, code, updatedAt',
        movements: 'id, organizationId, assetId, updatedAt',
        maintenance: 'id, organizationId, assetId, updatedAt',
        catalogs: 'id, organizationId, updatedAt',
        outbox: 'id, createdAt',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        for (const storeName of LEGACY_DATA_STORES) {
          await tx
            .table(storeName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              if (!record.organizationId) {
                record.organizationId = ''
              }
            })
        }
      })
  }
}

export const db = new UnopDb()

/** Registros locales huerfanos (migrados de la app legacy) sin organizationId asignado. */
export async function findUnassignedRecords(storeName: OutboxTable) {
  return db.table(storeName).where('organizationId').equals('').toArray()
}

export async function reassignRecordOrganization(storeName: OutboxTable, id: string, organizationId: string) {
  await db.table(storeName).update(id, { organizationId })
}
