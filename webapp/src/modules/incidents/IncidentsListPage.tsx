import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { listAssets } from '../../data/repositories/assetsRepo'
import { createIncident, listIncidents, type Incident, type IncidentInput } from '../../data/repositories/incidentsRepo'
import { listIncidentCategories, listServices, type IncidentCategory, type Service } from '../../data/repositories/servicesRepo'
import { listWorkers, type Worker } from '../../data/repositories/workersRepo'
import { ReportIncidentModal } from './ReportIncidentModal'

const TYPE_LABEL: Record<string, string> = {
  incidente: 'Incidente', solicitud: 'Solicitud', problema: 'Problema',
  cambio: 'Cambio', mantenimiento: 'Mantenimiento', aviso: 'Aviso',
}
const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', clasificado: 'Clasificado', en_progreso: 'En progreso',
  en_espera: 'En espera', resuelto: 'Resuelto', cerrado: 'Cerrado', reabierto: 'Reabierto',
}

const STATUS_BADGE: Record<string, string> = {
  nuevo: 'badge-info', clasificado: 'badge-info', en_progreso: 'badge-warning',
  en_espera: 'badge-warning', resuelto: 'badge-success', cerrado: 'badge-neutral', reabierto: 'badge-danger',
}

const PRIORITY_BADGE: Record<string, string> = {
  P1: 'badge-danger', P2: 'badge-warning', P3: 'badge-info', P4: 'badge-neutral',
}

const PAGE_SIZE = 20

export function IncidentsListPage() {
  const { membership, user } = useSession()
  const canWrite = can(membership?.role, 'incidents', 'write')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [categories, setCategories] = useState<IncidentCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [assets, setAssets] = useState<import('../../data/db').AssetRecord[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  async function refresh() {
    if (!membership) return
    setLoading(true)
    const orgId = membership.organizationId
    const [inc, cats, svcs, ast, wks] = await Promise.all([
      listIncidents(orgId),
      listIncidentCategories(orgId),
      listServices(orgId),
      listAssets(orgId),
      listWorkers(orgId),
    ])
    setIncidents(inc)
    setCategories(cats)
    setServices(svcs)
    setAssets(ast)
    setWorkers(wks)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  useEffect(() => setPage(1), [search, statusFilter, priorityFilter, typeFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return incidents.filter((i) => {
      const matchesSearch = !q || i.title.toLowerCase().includes(q) || (i.folio ?? '').toLowerCase().includes(q)
      const matchesStatus = !statusFilter || i.status === statusFilter
      const matchesPriority = !priorityFilter || i.priority === priorityFilter
      const matchesType = !typeFilter || i.type === typeFilter
      return matchesSearch && matchesStatus && matchesPriority && matchesType
    })
  }, [incidents, search, statusFilter, priorityFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate(input: IncidentInput) {
    if (!membership) return
    await createIncident(membership.organizationId, input, user?.id ?? null)
    setCreating(false)
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <span className="eyebrow">Incidentes</span>
          <h2>Incidentes y novedades</h2>
        </div>
        {canWrite && (
          <button className="btn" onClick={() => setCreating(true)}>
            Reportar novedad
          </button>
        )}
      </div>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label htmlFor="search">Buscar</label>
          <input id="search" placeholder="Título o folio" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="typeFilter">Tipo</label>
          <select id="typeFilter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priorityFilter">Prioridad</label>
          <select id="priorityFilter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="statusFilter">Estado</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p>Cargando...</p>
        ) : pageItems.length === 0 ? (
          <div className="empty-state">
            {incidents.length === 0 ? 'Todavía no hay novedades registradas.' : 'Ninguna novedad coincide con el filtro.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Folio</th><th>Título</th><th>Tipo</th><th>Prioridad</th><th>Estado</th><th>Creado</th></tr>
            </thead>
            <tbody>
              {pageItems.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/incidentes/${i.id}`} className="text-mono">{i.folio}</Link></td>
                  <td>{i.title}</td>
                  <td>{TYPE_LABEL[i.type] ?? i.type}</td>
                  <td><span className={`badge ${PRIORITY_BADGE[i.priority] ?? 'badge-neutral'}`}>{i.priority}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[i.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[i.status] ?? i.status}</span></td>
                  <td>{new Date(i.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
          <span>Página {page} de {totalPages} ({filtered.length})</span>
          <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
        </div>
      )}

      {creating && (
        <ReportIncidentModal
          categories={categories}
          services={services}
          assets={assets}
          workers={workers}
          onCancel={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}
