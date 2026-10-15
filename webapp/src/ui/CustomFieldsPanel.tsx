import { useEffect, useState } from 'react'
import {
  listFieldDefinitions,
  listValuesForEntity,
  setFieldValue,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
} from '../data/repositories/customFieldsRepo'

interface Props {
  organizationId: string
  entityType: CustomFieldEntityType
  entityId: string
  canWrite: boolean
}

type FieldValue = string | number | boolean

/** Panel generico para ver/editar los valores de los campos personalizados
 * que la organizacion haya definido (en Catalogos) para este tipo de
 * entidad. Mismo componente para activos, trabajadores e incidentes: el
 * modelo de datos es el mismo, solo cambia entityType/entityId. */
export function CustomFieldsPanel({ organizationId, entityType, entityId, canWrite }: Props) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([])
  const [values, setValues] = useState<Record<string, FieldValue>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listFieldDefinitions(organizationId, entityType), listValuesForEntity(organizationId, entityType, entityId)]).then(
      ([defs, valueMap]) => {
        if (!active) return
        setDefinitions(defs)
        const initial: Record<string, FieldValue> = {}
        for (const def of defs) {
          const stored = valueMap.get(def.id)?.value
          initial[def.id] = (stored as FieldValue | undefined) ?? (def.field_type === 'boolean' ? false : '')
        }
        setValues(initial)
      },
    )
    return () => {
      active = false
    }
  }, [organizationId, entityType, entityId])

  async function handleSave(def: CustomFieldDefinition, value: FieldValue) {
    setSaving(def.id)
    setError(null)
    try {
      await setFieldValue(organizationId, entityType, entityId, def.id, value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el campo.')
    } finally {
      setSaving(null)
    }
  }

  if (definitions.length === 0) return null

  return (
    <div className="card">
      <h3>Campos personalizados</h3>
      {error && <p className="text-danger text-small">{error}</p>}
      <div className="form-grid">
        {definitions.map((def) => {
          const value = values[def.id] ?? (def.field_type === 'boolean' ? false : '')
          return (
            <div className="field" key={def.id}>
              <label htmlFor={`cf-${def.id}`}>
                {def.label}
                {def.required && <span className="required"> *</span>}
              </label>
              {def.field_type === 'boolean' ? (
                <div className="field-checkbox">
                  <input
                    id={`cf-${def.id}`}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={!canWrite}
                    onChange={(e) => {
                      const next = e.target.checked
                      setValues((prev) => ({ ...prev, [def.id]: next }))
                      void handleSave(def, next)
                    }}
                  />
                </div>
              ) : def.field_type === 'select' ? (
                <select
                  id={`cf-${def.id}`}
                  value={typeof value === 'string' ? value : ''}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const next = e.target.value
                    setValues((prev) => ({ ...prev, [def.id]: next }))
                    void handleSave(def, next)
                  }}
                >
                  <option value="">Selecciona...</option>
                  {((def.options as string[] | null) ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`cf-${def.id}`}
                  type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                  value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const raw = e.target.value
                    const next = def.field_type === 'number' ? (raw === '' ? '' : Number(raw)) : raw
                    setValues((prev) => ({ ...prev, [def.id]: next }))
                  }}
                  onBlur={() => void handleSave(def, values[def.id] ?? '')}
                />
              )}
              {saving === def.id && <span className="text-muted text-small">Guardando...</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
