import { useEffect, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { listAreas, listLocations, type Area, type Location } from '../../data/repositories/catalogsRepo'
import {
  createWorker,
  listWorkers,
  softDeleteWorker,
  updateWorker,
  type Worker,
} from '../../data/repositories/workersRepo'
import { WorkerFormModal } from './WorkerFormModal'

export function WorkersPage() {
  const { membership } = useSession()
  const canWrite = can(membership?.role, 'workers', 'write')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [editing, setEditing] = useState<Worker | 'new' | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!membership) return
    const orgId = membership.organizationId
    const [w, a, l] = await Promise.all([listWorkers(orgId), listAreas(orgId), listLocations(orgId)])
    setWorkers(w)
    setAreas(a)
    setLocations(l)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  async function handleDelete(worker: Worker) {
    if (!confirm(`Eliminar a "${worker.full_name}" del directorio?`)) return
    await softDeleteWorker(worker.id)
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <h2 style={{ margin: 0 }}>Trabajadores</h2>
        {canWrite && (
          <button className="btn" onClick={() => setEditing('new')}>
            Registrar trabajador
          </button>
        )}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p>Cargando...</p>
        ) : workers.length === 0 ? (
          <div className="empty-state">Todavía no hay trabajadores registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Área</th>
                <th>Ubicación</th>
                <th>Estado</th>
                {canWrite && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td>{w.full_name}</td>
                  <td>{w.position || '—'}</td>
                  <td>{areas.find((a) => a.id === w.area_id)?.name ?? '—'}</td>
                  <td>{locations.find((l) => l.id === w.location_id)?.name ?? '—'}</td>
                  <td>
                    <span className="badge">{w.status === 'activo' ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  {canWrite && (
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn secondary" onClick={() => setEditing(w)}>
                        Editar
                      </button>
                      <button className="btn danger" onClick={() => void handleDelete(w)}>
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
        <WorkerFormModal
          areas={areas}
          locations={locations}
          initial={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            if (editing === 'new') await createWorker(membership.organizationId, input)
            else await updateWorker(editing.id, input)
            setEditing(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}
