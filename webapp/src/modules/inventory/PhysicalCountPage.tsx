import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { listLocations, type Location } from '../../data/repositories/catalogsRepo'
import {
  closeCount,
  getOpenCount,
  listCountItems,
  openCount,
  scanAssetIntoCount,
  type PhysicalCount,
  type PhysicalCountItem,
} from '../../data/repositories/physicalCountRepo'

const SCANNER_ELEMENT_ID = 'physical-count-qr-reader'

export function PhysicalCountPage() {
  const { membership, user } = useSession()
  const canWrite = can(membership?.role, 'inventory', 'admin')
  const [count, setCount] = useState<PhysicalCount | null>(null)
  const [items, setItems] = useState<(PhysicalCountItem & { assetCode?: string; assetName?: string })[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [scopeLocationId, setScopeLocationId] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [scannerOn, setScannerOn] = useState(false)
  const [closingNotes, setClosingNotes] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  async function refresh() {
    if (!membership) return
    const [open, locs] = await Promise.all([getOpenCount(membership.organizationId), listLocations(membership.organizationId)])
    setCount(open)
    setLocations(locs)
    if (open) setItems(await listCountItems(open.id))
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  async function handleOpen() {
    if (!membership) return
    const created = await openCount(membership.organizationId, scopeLocationId || null, user?.id ?? null)
    setCount(created)
    setItems(await listCountItems(created.id))
  }

  async function handleScanCode(code: string) {
    if (!count || !membership || !code.trim()) return
    const result = await scanAssetIntoCount(count.id, membership.organizationId, code.trim(), user?.id ?? null)
    setMessage(result.message)
    setItems(await listCountItems(count.id))
    setManualCode('')
  }

  async function startCamera() {
    setScannerOn(true)
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText) => void handleScanCode(decodedText),
          undefined,
        )
      } catch {
        setMessage('No se pudo acceder a la cámara. Usa el ingreso manual del código.')
        setScannerOn(false)
      }
    }, 100)
  }

  async function stopCamera() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current = null
    setScannerOn(false)
  }

  async function handleClose() {
    if (!count) return
    if (!confirm('Cerrar el conteo físico? Se generará el acta y no se podrán escanear más activos en esta sesión.')) return
    await closeCount(count.id, closingNotes, user?.id ?? null)
    if (scannerOn) await stopCamera()
    setCount(null)
    setItems([])
    setClosingNotes('')
  }

  const found = items.filter((i) => i.found)
  const missing = items.filter((i) => i.expected && !i.found)
  const unexpected = items.filter((i) => !i.expected && i.found)

  if (!count) {
    return (
      <div>
        <h2 style={{ marginTop: 0 }}>Inventario físico</h2>
        {canWrite ? (
          <div className="card" style={{ maxWidth: 420 }}>
            <p>Abrir una nueva sesión de conteo físico por escaneo de QR/código.</p>
            <div className="field">
              <label htmlFor="scopeLocation">Ubicación a contar (opcional)</label>
              <select id="scopeLocation" value={scopeLocationId} onChange={(e) => setScopeLocationId(e.target.value)}>
                <option value="">Toda la organización</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" onClick={() => void handleOpen()}>
              Abrir conteo
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)' }}>No tienes permiso para iniciar un conteo físico.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="app-topbar">
        <h2 style={{ margin: 0 }}>Conteo físico en curso</h2>
        {canWrite && (
          <button className="btn danger" onClick={() => void handleClose()}>
            Cerrar conteo y generar acta
          </button>
        )}
      </div>

      <div className="stat-grid">
        <div className="card stat-card"><strong>{found.length}</strong><span>Encontrados</span></div>
        <div className="card stat-card"><strong>{missing.length}</strong><span>Faltantes</span></div>
        <div className="card stat-card"><strong>{unexpected.length}</strong><span>Fuera de lugar</span></div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Escanear</h3>
        {!scannerOn ? (
          <button className="btn secondary" onClick={() => void startCamera()}>
            Activar cámara
          </button>
        ) : (
          <button className="btn secondary" onClick={() => void stopCamera()}>
            Detener cámara
          </button>
        )}
        <div id={SCANNER_ELEMENT_ID} style={{ maxWidth: 320, margin: '0.75rem 0' }} />
        <div className="field">
          <label htmlFor="manualCode">Ingreso manual del código</label>
          <input
            id="manualCode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleScanCode(manualCode)}
          />
        </div>
        <button className="btn" onClick={() => void handleScanCode(manualCode)}>
          Registrar
        </button>
        {message && <p style={{ color: 'var(--muted)' }}>{message}</p>}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Diferencias</h3>
        {missing.length === 0 && unexpected.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin diferencias por ahora.</p>
        ) : (
          <>
            {missing.map((i) => (
              <div key={i.id} style={{ color: 'var(--danger)' }}>Faltante: {i.assetCode} — {i.assetName}</div>
            ))}
            {unexpected.map((i) => (
              <div key={i.id} style={{ color: 'var(--warning)' }}>Fuera de lugar: {i.assetCode} — {i.assetName}</div>
            ))}
          </>
        )}
      </div>

      {canWrite && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Acta de cierre</h3>
          <div className="field">
            <label htmlFor="closingNotes">Notas / observaciones del conteo</label>
            <textarea id="closingNotes" rows={3} value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}
