import { useEffect, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import {
  createArea,
  createCategory,
  createLocation,
  createSite,
  listAreas,
  listCategories,
  listLocations,
  listSites,
  softDeleteCatalogEntry,
  type Area,
  type Category,
  type Location,
  type Site,
} from '../../data/repositories/catalogsRepo'
import {
  createFieldDefinition,
  listFieldDefinitions,
  softDeleteFieldDefinition,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
} from '../../data/repositories/customFieldsRepo'

type TabKey = 'sites' | 'locations' | 'areas' | 'categories' | 'customFields'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sites', label: 'Sedes' },
  { key: 'locations', label: 'Ubicaciones' },
  { key: 'areas', label: 'Áreas' },
  { key: 'categories', label: 'Categorías' },
  { key: 'customFields', label: 'Campos personalizados' },
]

const ENTITY_TYPE_LABELS: Record<CustomFieldEntityType, string> = {
  asset: 'Activos',
  worker: 'Trabajadores',
  incident: 'Incidentes',
}

const FIELD_TYPE_LABELS: Record<CustomFieldDefinition['field_type'], string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  boolean: 'Sí / No',
  select: 'Lista de opciones',
}

function slugifyFieldKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
}

export function CatalogsPage() {
  const { membership } = useSession()
  const canWrite = can(membership?.role, 'inventory', 'admin')
  const [tab, setTab] = useState<TabKey>('sites')

  const [sites, setSites] = useState<Site[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [name, setName] = useState('')
  const [siteId, setSiteId] = useState('')
  const [parentId, setParentId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [cfEntityType, setCfEntityType] = useState<CustomFieldEntityType>('asset')
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([])
  const [cfLabel, setCfLabel] = useState('')
  const [cfType, setCfType] = useState<CustomFieldDefinition['field_type']>('text')
  const [cfOptions, setCfOptions] = useState('')
  const [cfRequired, setCfRequired] = useState(false)
  const [cfError, setCfError] = useState<string | null>(null)

  async function refresh() {
    if (!membership) return
    const orgId = membership.organizationId
    const [s, l, a, c] = await Promise.all([
      listSites(orgId),
      listLocations(orgId),
      listAreas(orgId),
      listCategories(orgId),
    ])
    setSites(s)
    setLocations(l)
    setAreas(a)
    setCategories(c)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  async function refreshCustomFields() {
    if (!membership) return
    setCustomFields(await listFieldDefinitions(membership.organizationId, cfEntityType))
  }

  useEffect(() => {
    if (tab === 'customFields') void refreshCustomFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId, tab, cfEntityType])

  async function handleCreateCustomField() {
    if (!membership || !cfLabel.trim()) return
    setCfError(null)
    const key = slugifyFieldKey(cfLabel)
    if (!key) {
      setCfError('El nombre del campo debe tener al menos una letra o número.')
      return
    }
    try {
      await createFieldDefinition(membership.organizationId, {
        entityType: cfEntityType,
        key,
        label: cfLabel.trim(),
        fieldType: cfType,
        options: cfType === 'select' ? cfOptions.split(',').map((o) => o.trim()).filter(Boolean) : null,
        required: cfRequired,
      })
      setCfLabel('')
      setCfOptions('')
      setCfRequired(false)
      setCfType('text')
      await refreshCustomFields()
    } catch (err) {
      setCfError(err instanceof Error ? err.message : 'No se pudo crear el campo.')
    }
  }

  async function handleDeleteCustomField(id: string) {
    if (!confirm('Eliminar este campo personalizado? Los valores ya guardados dejarán de mostrarse.')) return
    await softDeleteFieldDefinition(id)
    await refreshCustomFields()
  }

  async function handleCreate() {
    if (!membership || !name.trim()) return
    setError(null)
    try {
      if (tab === 'sites') await createSite(membership.organizationId, { name })
      if (tab === 'locations') await createLocation(membership.organizationId, { name, site_id: siteId || null })
      if (tab === 'areas') await createArea(membership.organizationId, { name })
      if (tab === 'categories') await createCategory(membership.organizationId, { name, parent_id: parentId || null })
      setName('')
      setSiteId('')
      setParentId('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el registro.')
    }
  }

  async function handleDelete(table: Exclude<TabKey, 'customFields'>, id: string) {
    if (!confirm('Eliminar este elemento del catálogo?')) return
    await softDeleteCatalogEntry(table, id)
    await refresh()
  }

  const topCategories = categories.filter((c) => !c.parent_id)

  return (
    <div>
      <span className="eyebrow">Inventario</span>
      <h2>Catálogos</h2>

      <div className="tab-strip" style={{ marginTop: '1.1rem' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => {
              setTab(t.key)
              setError(null)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {canWrite && tab === 'customFields' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cfEntityType">Aplica a</label>
              <select id="cfEntityType" value={cfEntityType} onChange={(e) => setCfEntityType(e.target.value as CustomFieldEntityType)}>
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cfLabel">Nombre del campo</label>
              <input id="cfLabel" value={cfLabel} onChange={(e) => setCfLabel(e.target.value)} placeholder="Ej: Voltaje de operación" />
            </div>
            <div className="field">
              <label htmlFor="cfType">Tipo</label>
              <select id="cfType" value={cfType} onChange={(e) => setCfType(e.target.value as CustomFieldDefinition['field_type'])}>
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {cfType === 'select' && (
              <div className="field">
                <label htmlFor="cfOptions">Opciones (separadas por coma)</label>
                <input id="cfOptions" value={cfOptions} onChange={(e) => setCfOptions(e.target.value)} placeholder="Ej: 110V, 220V, 440V" />
              </div>
            )}
            <div className="field-checkbox">
              <input id="cfRequired" type="checkbox" checked={cfRequired} onChange={(e) => setCfRequired(e.target.checked)} />
              <label htmlFor="cfRequired">Obligatorio</label>
            </div>
          </div>
          {cfError && <p className="text-danger text-small">{cfError}</p>}
          <button className="btn" onClick={() => void handleCreateCustomField()} disabled={!cfLabel.trim()}>
            Agregar campo
          </button>
        </div>
      )}

      {canWrite && tab !== 'customFields' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="catName">Nombre</label>
              <input id="catName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {tab === 'locations' && (
              <div className="field">
                <label htmlFor="siteSelect">Sede (opcional)</label>
                <select id="siteSelect" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                  <option value="">Sin sede</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tab === 'categories' && (
              <div className="field">
                <label htmlFor="parentSelect">Categoría padre (opcional, para subcategoría)</label>
                <select id="parentSelect" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  <option value="">Categoría de nivel superior</option>
                  {topCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-danger text-small">{error}</p>}
          <button className="btn" onClick={() => void handleCreate()} disabled={!name.trim()}>
            Agregar
          </button>
        </div>
      )}

      <div className="card table-wrap">
        {tab === 'sites' && (
          <CatalogList
            rows={sites.map((s) => ({ id: s.id, label: s.name, sub: s.address ?? undefined }))}
            canWrite={canWrite}
            onDelete={(id) => void handleDelete('sites', id)}
          />
        )}
        {tab === 'locations' && (
          <CatalogList
            rows={locations.map((l) => ({
              id: l.id,
              label: l.name,
              sub: sites.find((s) => s.id === l.site_id)?.name,
            }))}
            canWrite={canWrite}
            onDelete={(id) => void handleDelete('locations', id)}
          />
        )}
        {tab === 'areas' && (
          <CatalogList
            rows={areas.map((a) => ({ id: a.id, label: a.name }))}
            canWrite={canWrite}
            onDelete={(id) => void handleDelete('areas', id)}
          />
        )}
        {tab === 'categories' && (
          <CatalogList
            rows={categories.map((c) => ({
              id: c.id,
              label: c.parent_id ? `— ${c.name}` : c.name,
              sub: c.parent_id ? `subcategoría de ${categories.find((p) => p.id === c.parent_id)?.name ?? ''}` : undefined,
            }))}
            canWrite={canWrite}
            onDelete={(id) => void handleDelete('categories', id)}
          />
        )}
        {tab === 'customFields' && (
          <CatalogList
            rows={customFields.map((f) => ({
              id: f.id,
              label: `${f.label}${f.required ? ' *' : ''}`,
              sub: `${FIELD_TYPE_LABELS[f.field_type]}${f.field_type === 'select' && f.options ? `: ${(f.options as string[]).join(', ')}` : ''}`,
            }))}
            canWrite={canWrite}
            onDelete={(id) => void handleDeleteCustomField(id)}
          />
        )}
      </div>
    </div>
  )
}

function CatalogList({
  rows,
  canWrite,
  onDelete,
}: {
  rows: { id: string; label: string; sub?: string }[]
  canWrite: boolean
  onDelete: (id: string) => void
}) {
  if (rows.length === 0) return <div className="empty-state">Todavía no hay elementos.</div>
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          {canWrite && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              {r.label}
              {r.sub && <div className="text-muted text-small">{r.sub}</div>}
            </td>
            {canWrite && (
              <td>
                <button className="btn danger btn-sm" onClick={() => onDelete(r.id)}>
                  Eliminar
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
