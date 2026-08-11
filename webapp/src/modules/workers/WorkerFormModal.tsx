import { useState, type FormEvent } from 'react'
import type { Area, Location } from '../../data/repositories/catalogsRepo'
import type { Worker, WorkerInput } from '../../data/repositories/workersRepo'

interface Props {
  areas: Area[]
  locations: Location[]
  initial?: Worker
  onCancel: () => void
  onSubmit: (input: WorkerInput) => Promise<void>
}

function toInput(w?: Worker): WorkerInput {
  return {
    full_name: w?.full_name ?? '',
    document: w?.document ?? '',
    position: w?.position ?? '',
    area_id: w?.area_id ?? null,
    location_id: w?.location_id ?? null,
    email: w?.email ?? '',
    phone: w?.phone ?? '',
    status: w?.status ?? 'activo',
    hire_date: w?.hire_date ?? null,
    birth_date: w?.birth_date ?? null,
    birthday_consent: w?.birthday_consent ?? false,
  }
}

export function WorkerFormModal({ areas, locations, initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<WorkerInput>(toInput(initial))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof WorkerInput>(key: K, value: WorkerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.full_name?.trim()) {
      setError('El nombre completo es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el trabajador.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <h2>{initial ? 'Editar trabajador' : 'Registrar trabajador'}</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="wFullName">Nombre completo *</label>
            <input id="wFullName" required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wDocument">Documento</label>
            <input id="wDocument" value={form.document ?? ''} onChange={(e) => set('document', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wPosition">Cargo</label>
            <input id="wPosition" value={form.position ?? ''} onChange={(e) => set('position', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wStatus">Estado laboral</label>
            <select id="wStatus" value={form.status ?? 'activo'} onChange={(e) => set('status', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="wArea">Área</label>
            <select id="wArea" value={form.area_id ?? ''} onChange={(e) => set('area_id', e.target.value || null)}>
              <option value="">Sin definir</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wLocation">Ubicación</label>
            <select id="wLocation" value={form.location_id ?? ''} onChange={(e) => set('location_id', e.target.value || null)}>
              <option value="">Sin definir</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wEmail">Correo laboral</label>
            <input id="wEmail" type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wPhone">Teléfono laboral</label>
            <input id="wPhone" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wHire">Fecha de ingreso</label>
            <input id="wHire" type="date" value={form.hire_date ?? ''} onChange={(e) => set('hire_date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="wBirth">Fecha de nacimiento</label>
            <input id="wBirth" type="date" value={form.birth_date ?? ''} onChange={(e) => set('birth_date', e.target.value)} />
          </div>
        </div>

        <div className="field field-checkbox">
          <input
            id="wConsent"
            type="checkbox"
            checked={form.birthday_consent ?? false}
            onChange={(e) => set('birthday_consent', e.target.checked)}
          />
          <label htmlFor="wConsent">
            El trabajador autoriza usar su nombre en recordatorios internos de cumpleaños
            (calendario y avisos por WhatsApp al equipo). Sin este consentimiento, no aparece
            en el calendario de cumpleaños ni recibe recordatorios asociados.
          </label>
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
