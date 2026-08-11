import { useState, type FormEvent } from 'react'
import type { Area, Category, Location } from '../../data/repositories/catalogsRepo'
import type { AssetRecord } from '../../data/db'
import type { AssetInput } from '../../data/repositories/assetsRepo'
import { isCodeTaken, isSerialTaken } from '../../data/repositories/assetsRepo'
import type { Worker } from '../../data/repositories/workersRepo'

const STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo (operativo)' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
]

interface Props {
  organizationId: string
  initial?: AssetRecord
  categories: Category[]
  locations: Location[]
  areas: Area[]
  workers: Worker[]
  onCancel: () => void
  onSubmit: (input: AssetInput) => Promise<void>
}

function toInput(record?: AssetRecord): AssetInput {
  return {
    name: record?.name ?? '',
    code: record?.code ?? '',
    category: record?.category ?? '',
    categoryId: record?.categoryId ?? null,
    subcategoryId: record?.subcategoryId ?? null,
    status: record?.status ?? 'activo',
    brand: record?.brand ?? '',
    model: record?.model ?? '',
    serial: record?.serial ?? '',
    tag: record?.tag ?? '',
    location: record?.location ?? '',
    locationId: record?.locationId ?? null,
    area: record?.area ?? '',
    areaId: record?.areaId ?? null,
    responsible: record?.responsible ?? '',
    workerId: record?.workerId ?? null,
    condition: record?.condition ?? '',
    acquisitionDate: record?.acquisitionDate ?? '',
    warrantyUntil: record?.warrantyUntil ?? '',
    notes: record?.notes ?? '',
    provider: record?.provider ?? '',
    invoiceNumber: record?.invoiceNumber ?? '',
    cost: record?.cost ?? null,
  }
}

export function AssetFormModal({ organizationId, initial, categories, locations, areas, workers, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<AssetInput>(toInput(initial))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const topCategories = categories.filter((c) => !c.parent_id)
  const subcategories = categories.filter((c) => c.parent_id === form.categoryId)

  function set<K extends keyof AssetInput>(key: K, value: AssetInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCategoryChange(id: string) {
    const cat = categories.find((c) => c.id === id)
    setForm((prev) => ({ ...prev, categoryId: id || null, category: cat?.name ?? '', subcategoryId: null }))
  }

  function handleLocationChange(id: string) {
    const loc = locations.find((l) => l.id === id)
    setForm((prev) => ({ ...prev, locationId: id || null, location: loc?.name ?? '' }))
  }

  function handleAreaChange(id: string) {
    const area = areas.find((a) => a.id === id)
    setForm((prev) => ({ ...prev, areaId: id || null, area: area?.name ?? '' }))
  }

  function handleWorkerChange(id: string) {
    const worker = workers.find((w) => w.id === id)
    setForm((prev) => ({ ...prev, workerId: id || null, responsible: worker?.full_name ?? '' }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.code.trim() || !form.category.trim()) {
      setError('Nombre, código y categoría son obligatorios.')
      return
    }

    const codeTaken = await isCodeTaken(organizationId, form.code.trim(), initial?.id)
    if (codeTaken) {
      setError(`El código "${form.code}" ya está en uso en esta organización.`)
      return
    }

    if (form.serial?.trim()) {
      const serialTaken = await isSerialTaken(organizationId, form.serial.trim(), initial?.id)
      if (serialTaken) {
        setError(`El serial "${form.serial}" ya está registrado en otro activo.`)
        return
      }
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
      <form className="modal" onSubmit={handleSubmit} style={{ maxWidth: 760 }}>
        <h2 id="asset-modal-title" style={{ marginTop: 0 }}>
          {initial ? 'Editar activo' : 'Registrar activo'}
        </h2>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Nombre *</label>
            <input id="name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="code">Código interno *</label>
            <input id="code" required value={form.code} onChange={(e) => set('code', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="category">Categoría *</label>
            <select id="category" required value={form.categoryId ?? ''} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">Selecciona una categoría</option>
              {topCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="subcategory">Subcategoría</label>
            <select
              id="subcategory"
              value={form.subcategoryId ?? ''}
              onChange={(e) => set('subcategoryId', e.target.value || null)}
              disabled={subcategories.length === 0}
            >
              <option value="">Sin subcategoría</option>
              {subcategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            <label htmlFor="location">Ubicación</label>
            <select id="location" value={form.locationId ?? ''} onChange={(e) => handleLocationChange(e.target.value)}>
              <option value="">Sin definir</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="area">Área</label>
            <select id="area" value={form.areaId ?? ''} onChange={(e) => handleAreaChange(e.target.value)}>
              <option value="">Sin definir</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="responsible">Responsable (trabajador)</label>
            <select id="responsible" value={form.workerId ?? ''} onChange={(e) => handleWorkerChange(e.target.value)}>
              <option value="">Sin asignar</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="condition">Condición física</label>
            <input id="condition" value={form.condition} onChange={(e) => set('condition', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="provider">Proveedor</label>
            <input id="provider" value={form.provider} onChange={(e) => set('provider', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="invoiceNumber">Número de factura</label>
            <input id="invoiceNumber" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cost">Costo</label>
            <input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={form.cost ?? ''}
              onChange={(e) => set('cost', e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="acquisitionDate">Fecha de adquisición</label>
            <input
              id="acquisitionDate"
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => set('acquisitionDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="warrantyUntil">Garantía hasta</label>
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
