import { useEffect, useRef, useState } from 'react'
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
import { csvBlob, downloadBlob } from '../../core/csv'
import { WorkerFormModal } from './WorkerFormModal'

const CSV_COLUMNS = ['full_name', 'document', 'position', 'area', 'location', 'email', 'phone', 'status', 'hire_date', 'birth_date']

/** Parser CSV minimo (soporta comillas y comas dentro de campos citados). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function WorkersPage() {
  const { membership } = useSession()
  const canWrite = can(membership?.role, 'workers', 'write')
  const [workers, setWorkers] = useState<Worker[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [editing, setEditing] = useState<Worker | 'new' | null>(null)
  const [loading, setLoading] = useState(true)
  const [importSummary, setImportSummary] = useState<string[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function exportCsv() {
    const header = CSV_COLUMNS
    const rows = workers.map((w) => [
      w.full_name,
      w.document ?? '',
      w.position ?? '',
      areas.find((a) => a.id === w.area_id)?.name ?? '',
      locations.find((l) => l.id === w.location_id)?.name ?? '',
      w.email ?? '',
      w.phone ?? '',
      w.status,
      w.hire_date ?? '',
      w.birth_date ?? '',
    ])
    downloadBlob(csvBlob([header, ...rows]), `trabajadores-${Date.now()}.csv`)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !membership) return
    const text = await file.text()
    const rows = parseCsv(text)
    if (rows.length === 0) {
      setImportSummary(['El archivo está vacío.'])
      return
    }

    const header = rows[0].map((h) => h.trim().toLowerCase())
    const dataRows = rows.slice(1)
    const results: string[] = []
    let imported = 0

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2
      const cols = dataRows[i]
      const get = (name: string) => {
        const idx = header.indexOf(name)
        return idx >= 0 ? (cols[idx] ?? '').trim() : ''
      }

      const fullName = get('full_name')
      if (!fullName) {
        results.push(`Fila ${rowNum}: nombre completo vacío, se omitió.`)
        continue
      }

      const hireDate = get('hire_date')
      const birthDate = get('birth_date')
      if (hireDate && !/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) {
        results.push(`Fila ${rowNum}: fecha de ingreso inválida ("${hireDate}"), se omitió.`)
        continue
      }
      if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        results.push(`Fila ${rowNum}: fecha de nacimiento inválida ("${birthDate}"), se omitió.`)
        continue
      }

      const areaName = get('area')
      const locationName = get('location')
      const areaId = areaName ? areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase())?.id ?? null : null
      const locationId = locationName ? locations.find((l) => l.name.toLowerCase() === locationName.toLowerCase())?.id ?? null : null

      try {
        await createWorker(membership.organizationId, {
          full_name: fullName,
          document: get('document') || null,
          position: get('position') || null,
          area_id: areaId,
          location_id: locationId,
          email: get('email') || null,
          phone: get('phone') || null,
          status: get('status') === 'inactivo' ? 'inactivo' : 'activo',
          hire_date: hireDate || null,
          birth_date: birthDate || null,
        })
        imported++
        if (areaName && !areaId) results.push(`Fila ${rowNum}: área "${areaName}" no existe en catálogos, se importó sin área.`)
        if (locationName && !locationId) results.push(`Fila ${rowNum}: ubicación "${locationName}" no existe en catálogos, se importó sin ubicación.`)
      } catch (err) {
        results.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'error al importar'}.`)
      }
    }

    setImportSummary([`${imported} de ${dataRows.length} trabajador(es) importados.`, ...results])
    if (fileInputRef.current) fileInputRef.current.value = ''
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <span className="eyebrow">Talento humano</span>
          <h2>Trabajadores</h2>
        </div>
        <div className="cluster">
          <button className="btn secondary" onClick={exportCsv}>
            Exportar CSV
          </button>
          {canWrite && (
            <>
              <button className="btn secondary" onClick={() => fileInputRef.current?.click()}>
                Importar CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => void handleImportFile(e)}
              />
              <button className="btn" onClick={() => setEditing('new')}>
                Registrar trabajador
              </button>
            </>
          )}
        </div>
      </div>

      {importSummary && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Resultado de la importación</h3>
          <ul className="divided-list text-small">
            {importSummary.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <button className="btn secondary" style={{ marginTop: '0.75rem' }} onClick={() => setImportSummary(null)}>
            Cerrar
          </button>
        </div>
      )}

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
                    <span className={`badge ${w.status === 'activo' ? 'badge-success' : 'badge-neutral'}`}>{w.status === 'activo' ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  {canWrite && (
                    <td className="cluster">
                      <button className="btn secondary btn-sm" onClick={() => setEditing(w)}>
                        Editar
                      </button>
                      <button className="btn danger btn-sm" onClick={() => void handleDelete(w)}>
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
          organizationId={membership.organizationId}
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
