import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import {
  computeStockByItem,
  createInventoryItem,
  listInventoryItems,
  listStockMovements,
  registerStockMovement,
  type InventoryItem,
  type StockMovement,
} from '../../data/repositories/stockRepo'

export function StockPage() {
  const { membership, user } = useSession()
  const canWrite = can(membership?.role, 'inventory', 'write')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingItem, setCreatingItem] = useState(false)
  const [movementFor, setMovementFor] = useState<InventoryItem | null>(null)

  async function refresh() {
    if (!membership) return
    setLoading(true)
    const [i, m] = await Promise.all([listInventoryItems(membership.organizationId), listStockMovements(membership.organizationId)])
    setItems(i)
    setMovements(m)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  const stockByItem = computeStockByItem(movements)

  return (
    <div>
      <div className="app-topbar">
        <h2 style={{ margin: 0 }}>Consumibles y existencias</h2>
        {canWrite && (
          <button className="btn" onClick={() => setCreatingItem(true)}>
            Nuevo consumible
          </button>
        )}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <p>Cargando...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">Todavía no hay consumibles registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock actual</th>
                <th>Mínimo</th>
                <th>Proveedor</th>
                {canWrite && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const stock = stockByItem[item.id] ?? 0
                const low = stock < item.min_stock
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category || '—'}</td>
                    <td style={low ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>
                      {stock} {item.unit}
                      {low && ' ⚠'}
                    </td>
                    <td>{item.min_stock} {item.unit}</td>
                    <td>{item.provider || '—'}</td>
                    {canWrite && (
                      <td>
                        <button className="btn secondary" onClick={() => setMovementFor(item)}>
                          Registrar movimiento
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {creatingItem && membership && (
        <NewItemModal
          onCancel={() => setCreatingItem(false)}
          onSubmit={async (input) => {
            await createInventoryItem(membership.organizationId, input)
            setCreatingItem(false)
            await refresh()
          }}
        />
      )}

      {movementFor && membership && (
        <MovementModal
          item={movementFor}
          onCancel={() => setMovementFor(null)}
          onSubmit={async (type, quantity, reason) => {
            await registerStockMovement(membership.organizationId, {
              item_id: movementFor.id,
              type,
              quantity,
              reason,
              createdBy: user?.id ?? null,
            })
            setMovementFor(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

function NewItemModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: (input: { name: string; category: string | null; unit: string; min_stock: number; provider: string | null }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('unidad')
  const [minStock, setMinStock] = useState('0')
  const [provider, setProvider] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSubmit({ name, category: category || null, unit, min_stock: Number(minStock) || 0, provider: provider || null })
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Nuevo consumible</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="iName">Nombre *</label>
            <input id="iName" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iCategory">Categoría</label>
            <input id="iCategory" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iUnit">Unidad</label>
            <input id="iUnit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iMin">Stock mínimo</label>
            <input id="iMin" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iProvider">Proveedor</label>
            <input id="iProvider" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

function MovementModal({
  item,
  onCancel,
  onSubmit,
}: {
  item: InventoryItem
  onCancel: () => void
  onSubmit: (type: 'entrada' | 'salida', quantity: number, reason: string | null) => Promise<void>
}) {
  const [type, setType] = useState<'entrada' | 'salida'>('entrada')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = Number(quantity)
    if (!q || q <= 0) {
      setError('La cantidad debe ser mayor a cero.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(type, q, reason || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Movimiento de {item.name}</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="movType">Tipo</label>
            <select id="movType" value={type} onChange={(e) => setType(e.target.value as 'entrada' | 'salida')}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="movQty">Cantidad</label>
            <input id="movQty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="movReason">Motivo</label>
          <input id="movReason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
        </div>
      </form>
    </div>
  )
}
