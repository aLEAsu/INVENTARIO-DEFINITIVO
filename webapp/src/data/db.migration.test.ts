import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { UnopDb } from './db'

const DB_NAME = 'unop-activo-db'

/** Recrea exactamente lo que hace la app legacy (app.js): stores keyPath 'id', sin indices. */
function seedLegacyV1Database(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const idb = req.result
      for (const store of ['assets', 'movements', 'maintenance', 'catalogs', 'outbox', 'settings']) {
        if (!idb.objectStoreNames.contains(store)) idb.createObjectStore(store, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => {
      const idb = req.result
      const tx = idb.transaction('assets', 'readwrite')
      tx.objectStore('assets').add({
        id: 'legacy-asset-1',
        name: 'PC legacy sin organizacion',
        code: 'LEGACY-001',
        category: 'Computador',
        status: 'activo',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
      tx.oncomplete = () => {
        idb.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  })
}

describe('migracion Dexie v1 -> v2', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME)
    await seedLegacyV1Database()
  })

  it('conserva los registros legacy y les asigna el sentinel de organizationId vacio', async () => {
    const db = new UnopDb()
    const asset = await db.assets.get('legacy-asset-1')

    expect(asset).toBeDefined()
    expect(asset?.name).toBe('PC legacy sin organizacion')
    expect(asset?.organizationId).toBe('')

    db.close()
  })

  it('permite ubicar los registros huerfanos para repararlos tras el login', async () => {
    const db = new UnopDb()
    await db.assets.get('legacy-asset-1')

    const orphans = await db.assets.where('organizationId').equals('').toArray()
    expect(orphans).toHaveLength(1)
    expect(orphans[0].id).toBe('legacy-asset-1')

    db.close()
  })
})
