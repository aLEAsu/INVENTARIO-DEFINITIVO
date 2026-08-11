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

type TabKey = 'sites' | 'locations' | 'areas' | 'categories'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sites', label: 'Sedes' },
  { key: 'locations', label: 'Ubicaciones' },
  { key: 'areas', label: 'Áreas' },
  { key: 'categories', label: 'Categorías' },
]

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

  async function handleDelete(table: TabKey, id: string) {
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

      {canWrite && (
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
