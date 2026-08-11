import { useState, type FormEvent } from 'react'
import type { AssetRecord } from '../../data/db'
import type { AssetInput } from '../../data/repositories/assetsRepo'
import { isCodeTaken } from '../../data/repositories/assetsRepo'

const STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo (operativo)' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'baja', label: 'Dado de baja' },
]

interface Props {
  organizationId: string
  initial?: AssetRecord
  onCancel: () => void
  onSubmit: (input: AssetInput) => Promise<void>
}

function toInput(record?: AssetRecord): AssetInput {
  return {
    name: record?.name ?? '',
    code: record?.code ?? '',
    category: record?.category ?? '',
    status: record?.status ?? 'activo',
    brand: record?.brand ?? '',
    model: record?.model ?? '',
    serial: record?.serial ?? '',
    tag: record?.tag ?? '',
    location: record?.location ?? '',
    area: record?.area ?? '',
    responsible: record?.responsible ?? '',
    condition: record?.condition ?? '',
    acquisitionDate: record?.acquisitionDate ?? '',
    warrantyUntil: record?.warrantyUntil ?? '',
    notes: record?.notes ?? '',
  }
}

export function AssetFormModal({ organizationId, initial, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<AssetInput>(toInput(initial))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof AssetInput>(key: K, value: AssetInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.code.trim() || !form.category.trim()) {
      setError('Nombre, codigo y categoria son obligatorios.')
      return
    }

    const taken = await isCodeTaken(organizationId, form.code.trim(), initial?.id)
    if (taken) {
      setError(`El codigo "${form.code}" ya esta en uso en esta organizacion.`)
      return
    }

    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
      <form className="modal" onSubmit={handleSubmit}>
        <h2 id="asset-modal-title" style={{ marginTop: 0 }}>
          {initial ? 'Editar activo' : 'Registrar activo'}
        </h2>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Nombre *</label>
            <input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="code">Codigo interno *</label>
            <input id="code" required value={form.code} onChange={(e) => set('code', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="category">Categoria *</label>
            <input id="category" required value={form.category} onChange={(e) => set('category', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="status">Estado</label>
            <select id="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="brand">Marca</label>
            <input id="brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="model">Modelo</label>
            <input id="model" value={form.model} onChange={(e) => set('model', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="serial">Serial</label>
            <input id="serial" value={form.serial} onChange={(e) => set('serial', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="tag">Placa / etiqueta</label>
            <input id="tag" value={form.tag} onChange={(e) => set('tag', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="location">Ubicacion</label>
            <input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="area">Area</label>
            <input id="area" value={form.area} onChange={(e) => set('area', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="responsible">Responsable</label>
            <input id="responsible" value={form.responsible} onChange={(e) => set('responsible', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="condition">Condicion fisica</label>
            <input id="condition" value={form.condition} onChange={(e) => set('condition', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="acquisitionDate">Fecha de adquisicion</label>
            <input
              id="acquisitionDate"
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => set('acquisitionDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="warrantyUntil">Garantia hasta</label>
            <input
              id="warrantyUntil"
              type="date"
              value={form.warrantyUntil}
              onChange={(e) => set('warrantyUntil', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Observaciones</label>
          <textarea id="notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

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
