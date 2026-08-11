import { useState, type FormEvent } from 'react'
import type { AssetRecord } from '../../data/db'
import type { IncidentCategory, Service } from '../../data/repositories/servicesRepo'
import type { IncidentInput } from '../../data/repositories/incidentsRepo'
import type { Worker } from '../../data/repositories/workersRepo'

const TYPE_OPTIONS = [
  { value: 'incidente', label: 'Incidente' },
  { value: 'solicitud', label: 'Solicitud' },
  { value: 'problema', label: 'Problema' },
  { value: 'cambio', label: 'Cambio planificado' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'aviso', label: 'Aviso informativo' },
]

interface Props {
  categories: IncidentCategory[]
  services: Service[]
  assets: AssetRecord[]
  workers: Worker[]
  onCancel: () => void
  onSubmit: (input: IncidentInput) => Promise<void>
}

export function ReportIncidentModal({ categories, services, assets, workers, onCancel, onSubmit }: Props) {
  const [type, setType] = useState('incidente')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('P3')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetId, setAssetId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [affectedUsers, setAffectedUsers] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('El título es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        type,
        category_id: categoryId || null,
        priority,
        title,
        description: description || null,
        asset_id: assetId || null,
        service_id: serviceId || null,
        worker_id: workerId || null,
        affected_users_count: affectedUsers ? Number(affectedUsers) : null,
        status: 'nuevo',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la novedad.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        <h2>Reportar novedad</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="iType">Tipo</label>
            <select id="iType" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="iCategory">Categoría</label>
            <select id="iCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin definir</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="iPriority">Prioridad</label>
            <select id="iPriority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="P1">P1 — Crítica</option>
              <option value="P2">P2 — Alta</option>
              <option value="P3">P3 — Media</option>
              <option value="P4">P4 — Baja</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="iAffected">Usuarios afectados (aprox.)</label>
            <input id="iAffected" type="number" min="0" value={affectedUsers} onChange={(e) => setAffectedUsers(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iAsset">Activo afectado</label>
            <select id="iAsset" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">Ninguno</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="iService">Servicio afectado</label>
            <select id="iService" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Ninguno</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="iWorker">Trabajador que reporta/afectado</label>
            <select id="iWorker" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
              <option value="">Sin definir</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="iTitle">Título *</label>
          <input id="iTitle" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="iDescription">Descripción</label>
          <textarea id="iDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-danger text-small">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Guardando...' : 'Reportar'}
          </button>
        </div>
      </form>
    </div>
  )
}
