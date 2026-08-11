import { useEffect, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { listPublicStatusSnapshot, type PublicStatusEntry } from '../../data/repositories/incidentsRepo'
import { listIncidentCategories, type IncidentCategory } from '../../data/repositories/servicesRepo'

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

const ACTIVE_STATUSES = new Set(['nuevo', 'clasificado', 'en_progreso', 'en_espera', 'reabierto'])

export function StatusPanelPage() {
  const { membership } = useSession()
  const [entries, setEntries] = useState<PublicStatusEntry[]>([])
  const [categories, setCategories] = useState<IncidentCategory[]>([])

  useEffect(() => {
    if (!membership) return
    void Promise.all([listPublicStatusSnapshot(membership.organizationId), listIncidentCategories(membership.organizationId)]).then(
      ([e, c]) => {
        setEntries(e)
        setCategories(c)
      },
    )
  }, [membership?.organizationId])

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '—'

  const active = entries.filter((e) => ACTIVE_STATUSES.has(e.status) && e.type !== 'mantenimiento')
  const scheduledMaintenance = entries.filter((e) => e.type === 'mantenimiento' && e.status !== 'cerrado')
  const recentlyResolved = entries
    .filter((e) => e.status === 'resuelto' && e.resolved_at)
    .filter((e) => Date.now() - new Date(e.resolved_at!).getTime() < 7 * 86400000)

  function renderList(list: PublicStatusEntry[], emptyText: string) {
    if (list.length === 0) return <p className="text-muted">{emptyText}</p>
    return (
      <div className="table-wrap">
        <table>
          <thead><tr><th>Folio</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td className="text-mono">{e.folio}</td>
                <td>{categoryName(e.category_id)}</td>
                <td><span className={`badge ${PRIORITY_BADGE[e.priority] ?? 'badge-neutral'}`}>{e.priority}</span></td>
                <td><span className={`badge ${STATUS_BADGE[e.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[e.status] ?? e.status}</span></td>
                <td>{new Date(e.created_at).toLocaleDateString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <span className="eyebrow">Incidentes</span>
      <h2>Panel de estado</h2>
      <p className="text-muted" style={{ marginTop: '0.3rem' }}>
        Vista para todo el equipo. No muestra descripciones, comentarios internos ni datos de quien reporta.
      </p>

      <div className="card" style={{ marginBottom: '1rem', marginTop: '1.1rem' }}>
        <h3>Incidentes activos</h3>
        {renderList(active, 'No hay incidentes activos en este momento.')}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Mantenimientos programados</h3>
        {renderList(scheduledMaintenance, 'No hay mantenimientos programados.')}
      </div>

      <div className="card">
        <h3>Resueltas recientemente</h3>
        {renderList(recentlyResolved, 'Sin novedades resueltas en los últimos 7 días.')}
      </div>
    </div>
  )
}
