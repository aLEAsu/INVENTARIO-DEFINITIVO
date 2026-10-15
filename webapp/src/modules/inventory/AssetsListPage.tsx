import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import writeXlsxFile from 'write-excel-file/browser'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import type { AssetRecord } from '../../data/db'
import { createAsset, listAssets, repairLegacyAssets, syncOutbox, type AssetInput } from '../../data/repositories/assetsRepo'
import { listAreas, listCategories, listLocations, type Area, type Category, type Location } from '../../data/repositories/catalogsRepo'
import { listWorkers, type Worker } from '../../data/repositories/workersRepo'
import { csvBlob, downloadBlob } from '../../core/csv'
import { AssetFormModal } from './AssetFormModal'

const STATUS_LABEL: Record<string, string> = {
  activo: 'Activo',
  asignado: 'Asignado',
  mantenimiento: 'Mantenimiento',
  baja: 'Dado de baja',
}

const STATUS_BADGE: Record<string, string> = {
  activo: 'badge-success',
  asignado: 'badge-info',
  mantenimiento: 'badge-warning',
  baja: 'badge-neutral',
}

const PAGE_SIZE = 20

export function AssetsListPage() {
  const { membership } = useSession()
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingSync, setPendingSync] = useState(0)
  const [page, setPage] = useState(1)

  const canWrite = can(membership?.role, 'inventory', 'write')

  async function refresh() {
    if (!membership) return
    setLoading(true)
    const orgId = membership.organizationId
    const repaired = await repairLegacyAssets(orgId)
    if (repaired > 0) setToast(`Se recuperaron ${repaired} activo(s) guardados localmente antes del login.`)
    const [list, cats, locs, ars, ws] = await Promise.all([
      listAssets(orgId),
      listCategories(orgId),
      listLocations(orgId),
      listAreas(orgId),
      listWorkers(orgId),
    ])
    setAssets(list)
    setCategories(cats)
    setLocations(locs)
    setAreas(ars)
    setWorkers(ws)
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

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets.filter((a) => {
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.responsible ?? '').toLowerCase().includes(q) ||
        (a.serial ?? '').toLowerCase().includes(q)
      const matchesStatus = !statusFilter || a.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assets, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate(input: AssetInput) {
    if (!membership) return
    await createAsset(membership.organizationId, input)
    setCreating(false)
    await refresh()
  }

  function exportCsv() {
    const header = ['Codigo', 'Nombre', 'Categoria', 'Estado', 'Responsable', 'Ubicacion', 'Serial', 'Costo']
    const rows = filtered.map((a) => [a.code, a.name, a.category, STATUS_LABEL[a.status] ?? a.status, a.responsible ?? '', a.location ?? '', a.serial ?? '', a.cost ?? ''])
    downloadBlob(csvBlob([header, ...rows]), `activos-${Date.now()}.csv`)
  }

  async function exportXlsx() {
    const columns = [
      { header: 'Código', cell: (a: AssetRecord) => a.code },
      { header: 'Nombre', cell: (a: AssetRecord) => a.name },
      { header: 'Categoría', cell: (a: AssetRecord) => a.category },
      { header: 'Estado', cell: (a: AssetRecord) => STATUS_LABEL[a.status] ?? a.status },
      { header: 'Responsable', cell: (a: AssetRecord) => a.responsible ?? '' },
      { header: 'Ubicación', cell: (a: AssetRecord) => a.location ?? '' },
      { header: 'Serial', cell: (a: AssetRecord) => a.serial ?? '' },
      { header: 'Costo', cell: (a: AssetRecord) => a.cost ?? 0 },
    ]
    await writeXlsxFile(filtered, { columns }).toFile(`activos-${Date.now()}.xlsx`)
  }

  function exportPdf() {
    const doc = new jsPDF()
    doc.text('Inventario de activos - UNOP TI Hub', 14, 14)
    autoTable(doc, {
      startY: 20,
      head: [['Código', 'Nombre', 'Categoría', 'Estado', 'Responsable', 'Ubicación']],
      body: filtered.map((a) => [a.code, a.name, a.category, STATUS_LABEL[a.status] ?? a.status, a.responsible ?? '—', a.location ?? '—']),
      styles: { fontSize: 8 },
    })
    doc.save(`activos-${Date.now()}.pdf`)
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <span className="eyebrow">Inventario</span>
          <h2>Activos</h2>
        </div>
        <div className="cluster">
          <button className="btn secondary" onClick={exportCsv}>CSV</button>
          <button className="btn secondary" onClick={() => void exportXlsx()}>Excel</button>
          <button className="btn secondary" onClick={exportPdf}>PDF</button>
          {canWrite && (
            <button className="btn" onClick={() => setCreating(true)}>
              Registrar activo
            </button>
          )}
        </div>
      </div>

      {pendingSync > 0 && (
        <div className="notice">
          {pendingSync} cambio(s) pendientes de sincronizar con Supabase (sin conexión o error previo).
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label htmlFor="search">Buscar</label>
          <input
            id="search"
            placeholder="Nombre, código, serial o responsable"
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

      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          {assets.length === 0
            ? 'Todavía no hay activos registrados en esta organización.'
            : 'Ningún activo coincide con la búsqueda/filtro actual.'}
        </div>
      ) : (
        <>
          <div className="card table-wrap asset-table-desktop">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((asset) => (
                  <tr key={asset.id}>
                    <td><Link to={`/inventario/${asset.id}`} className="text-mono">{asset.code}</Link></td>
                    <td>{asset.name}</td>
                    <td>{asset.category}</td>
                    <td><span className={`badge ${STATUS_BADGE[asset.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[asset.status] ?? asset.status}</span></td>
                    <td>{asset.responsible || '—'}</td>
                    <td>{asset.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="asset-cards-mobile">
            {pageItems.map((asset) => (
              <Link to={`/inventario/${asset.id}`} key={asset.id} className="card asset-card-link">
                <strong>{asset.name}</strong>
                <div className="text-muted text-small text-mono">{asset.code}</div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className={`badge ${STATUS_BADGE[asset.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[asset.status] ?? asset.status}</span>
                </div>
                <div className="text-small" style={{ marginTop: '0.4rem' }}>
                  {asset.location || 'Sin ubicación'} · {asset.responsible || 'Sin responsable'}
                </div>
              </Link>
            ))}
          </div>

          <div className="pagination">
            <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {totalPages} ({filtered.length} activos)
            </span>
            <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </button>
          </div>
        </>
      )}

      {creating && membership && (
        <AssetFormModal
          organizationId={membership.organizationId}
          categories={categories}
          locations={locations}
          areas={areas}
          workers={workers}
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

