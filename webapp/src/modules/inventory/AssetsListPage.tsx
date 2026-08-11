import { useEffect, useMemo, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import type { AssetRecord } from '../../data/db'
import {
  createAsset,
  deleteAsset,
  listAssets,
  repairLegacyAssets,
  syncOutbox,
  updateAsset,
  type AssetInput,
} from '../../data/repositories/assetsRepo'
import { AssetFormModal } from './AssetFormModal'

const STATUS_LABEL: Record<string, string> = {
  activo: 'Activo',
  asignado: 'Asignado',
  mantenimiento: 'Mantenimiento',
  baja: 'Dado de baja',
}

export function AssetsListPage() {
  const { membership } = useSession()
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<AssetRecord | 'new' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingSync, setPendingSync] = useState(0)

  const canWrite = can(membership?.role, 'inventory', 'write')

  async function refresh() {
    if (!membership) return
    setLoading(true)
    const repaired = await repairLegacyAssets(membership.organizationId)
    if (repaired > 0) setToast(`Se recuperaron ${repaired} activo(s) guardados localmente antes del login.`)
    const list = await listAssets(membership.organizationId)
    setAssets(list)
    setLoading(false)
    const sync = await syncOutbox()
    setPendingSync(sync.pending)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets.filter((a) => {
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.responsible ?? '').toLowerCase().includes(q)
      const matchesStatus = !statusFilter || a.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assets, search, statusFilter])

  async function handleCreate(input: AssetInput) {
    if (!membership) return
    await createAsset(membership.organizationId, input)
    setEditing(null)
    await refresh()
  }

  async function handleUpdate(existing: AssetRecord, input: AssetInput) {
    await updateAsset(existing, input)
    setEditing(null)
    await refresh()
  }

  async function handleDelete(record: AssetRecord) {
    if (!confirm(`Eliminar el activo "${record.name}" (${record.code})? Esta accion no se puede deshacer.`)) return
    await deleteAsset(record)
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <h2 style={{ margin: 0 }}>Inventario y activos</h2>
        {canWrite && (
          <button className="btn" onClick={() => setEditing('new')}>
            Registrar activo
          </button>
        )}
      </div>

      {pendingSync > 0 && (
        <div className="card" style={{ marginBottom: '1rem', color: 'var(--warning)' }}>
          {pendingSync} cambio(s) pendientes de sincronizar con Supabase (sin conexion o error previo).
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label htmlFor="search">Buscar</label>
          <input
            id="search"
            placeholder="Nombre, codigo o responsable"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="statusFilter">Estado</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {assets.length === 0
              ? 'Todavia no hay activos registrados en esta organizacion.'
              : 'Ningun activo coincide con la busqueda/filtro actual.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Ubicacion</th>
                {canWrite && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.code}</td>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>
                    <span className="badge">{STATUS_LABEL[asset.status] ?? asset.status}</span>
                  </td>
                  <td>{asset.responsible || '—'}</td>
                  <td>{asset.location || '—'}</td>
                  {canWrite && (
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn secondary" onClick={() => setEditing(asset)}>
                        Editar
                      </button>
                      <button className="btn danger" onClick={() => void handleDelete(asset)}>
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && membership && (
        <AssetFormModal
          organizationId={membership.organizationId}
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={(input) => (editing === 'new' ? handleCreate(input) : handleUpdate(editing, input))}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
