import { useEffect, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { listPublicStatusSnapshot, type PublicStatusEntry } from '../../data/repositories/incidentsRepo'
import { listIncidentCategories, type IncidentCategory } from '../../data/repositories/servicesRepo'

const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', clasificado: 'Clasificado', en_progreso: 'En progreso',
  en_espera: 'En espera', resuelto: 'Resuelto', cerrado: 'Cerrado', reabierto: 'Reabierto',
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
    if (list.length === 0) return <p style={{ color: 'var(--muted)' }}>{emptyText}</p>
    return (
      <table>
        <thead><tr><th>Folio</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr></thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td>{e.folio}</td>
              <td>{categoryName(e.category_id)}</td>
              <td><span className="badge">{e.priority}</span></td>
              <td><span className="badge">{STATUS_LABEL[e.status] ?? e.status}</span></td>
              <td>{new Date(e.created_at).toLocaleDateString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Panel de estado</h2>
      <p style={{ color: 'var(--muted)' }}>
        Vista para todo el equipo. No muestra descripciones, comentarios internos ni datos de quien reporta.
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Incidentes activos</h3>
        {renderList(active, 'No hay incidentes activos en este momento.')}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Mantenimientos programados</h3>
        {renderList(scheduledMaintenance, 'No hay mantenimientos programados.')}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Resueltas recientemente</h3>
        {renderList(recentlyResolved, 'Sin novedades resueltas en los últimos 7 días.')}
      </div>
    </div>
  )
}
