import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import type { AssetRecord } from '../../data/db'
import { listAssets } from '../../data/repositories/assetsRepo'
import { createMaintenance, listMaintenance, updateMaintenanceStatus, type MaintenanceInput, type MaintenanceRecord } from '../../data/repositories/maintenanceRepo'

const STATUS_LABEL: Record<string, string> = { pendiente: 'Pendiente', proceso: 'En proceso', completado: 'Completado' }
const STATUS_BADGE: Record<string, string> = { pendiente: 'badge-warning', proceso: 'badge-info', completado: 'badge-success' }

export function MaintenancePage() {
  const { membership } = useSession()
  const canWrite = can(membership?.role, 'inventory', 'write')
  const [items, setItems] = useState<MaintenanceRecord[]>([])
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function refresh() {
    if (!membership) return
    setLoading(true)
    const [m, a] = await Promise.all([listMaintenance(membership.organizationId), listAssets(membership.organizationId)])
    setItems(m)
    setAssets(a)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  async function handleComplete(m: MaintenanceRecord) {
    await updateMaintenanceStatus(m.id, 'completado')
    await refresh()
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <span className="eyebrow">Inventario</span>
          <h2>Mantenimientos</h2>
        </div>
        {canWrite && (
          <button className="btn" onClick={() => setCreating(true)}>
            Registrar mantenimiento
          </button>
        )}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p>Cargando...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">Todavía no hay mantenimientos registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Activo</th>
                <th>Tipo</th>
                <th>Técnico/Proveedor</th>
                <th>Diagnóstico</th>
                <th>Próxima fecha</th>
                <th>Estado</th>
                {canWrite && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.assetName}</td>
                  <td>{m.type}</td>
                  <td>{m.technician || m.provider || '—'}</td>
                  <td>{m.diagnosis || '—'}</td>
                  <td>{m.next_due_date || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[m.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[m.status] ?? m.status}</span></td>
                  {canWrite && (
                    <td>
                      {m.status !== 'completado' && (
                        <button className="btn secondary btn-sm" onClick={() => void handleComplete(m)}>
                          Marcar completado
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && membership && (
        <MaintenanceFormModal
          organizationId={membership.organizationId}
          assets={assets}
          onCancel={() => setCreating(false)}
          onSubmit={async (input) => {
            await createMaintenance(membership.organizationId, input)
            setCreating(false)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

function MaintenanceFormModal({
  organizationId: _organizationId,
  assets,
  onCancel,
  onSubmit,
}: {
  organizationId: string
  assets: AssetRecord[]
  onCancel: () => void
  onSubmit: (input: MaintenanceInput) => Promise<void>
}) {
  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState('Preventivo')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [technician, setTechnician] = useState('')
  const [provider, setProvider] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [partsUsed, setPartsUsed] = useState('')
  const [cost, setCost] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [status, setStatus] = useState('pendiente')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) {
      setError('Selecciona un activo.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        assetId,
        assetName: asset.name,
        type,
        date,
        technician: technician || null,
        provider: provider || null,
        diagnosis: diagnosis || null,
        parts_used: partsUsed || null,
        cost: cost ? Number(cost) : 0,
        next_due_date: nextDueDate || null,
        status,
        notes: notes || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el mantenimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>Registrar mantenimiento</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="mAsset">Activo *</label>
            <select id="mAsset" required value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">Selecciona un activo</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mType">Tipo</label>
            <select id="mType" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Inspección">Inspección</option>
              <option value="Actualización">Actualización</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mDate">Fecha</label>
            <input id="mDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mStatus">Estado</label>
            <select id="mStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="proceso">En proceso</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mTechnician">Técnico</label>
            <input id="mTechnician" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mProvider">Proveedor</label>
            <input id="mProvider" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mCost">Costo</label>
            <input id="mCost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="mNextDue">Próxima fecha</label>
            <input id="mNextDue" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="mDiagnosis">Diagnóstico</label>
          <textarea id="mDiagnosis" rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mParts">Repuestos utilizados</label>
          <textarea id="mParts" rows={2} value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mNotes">Notas</label>
          <textarea id="mNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-danger text-small">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
