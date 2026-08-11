import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { generateAssetQrDataUrl } from '../../core/qr'
import type { AssetRecord } from '../../data/db'
import { getAsset, softDeleteAsset, updateAsset } from '../../data/repositories/assetsRepo'
import { listAssignmentsForAsset, assignAssetToWorker, returnAsset, type AssetAssignment } from '../../data/repositories/assignmentsRepo'
import { listMaintenanceForAsset, type MaintenanceRecord } from '../../data/repositories/maintenanceRepo'
import { listAuditForRecord, type AuditEntry } from '../../data/repositories/auditRepo'
import { listAttachments, uploadAttachment, deleteAttachment, getAttachmentUrl, type Attachment } from '../../data/repositories/attachmentsRepo'
import { listWorkers, type Worker } from '../../data/repositories/workersRepo'
import { AssetFormModal } from './AssetFormModal'
import { listAreas, listCategories, listLocations, type Area, type Category, type Location } from '../../data/repositories/catalogsRepo'

const ACTION_LABEL: Record<string, string> = { insert: 'Alta', update: 'Actualización', delete: 'Eliminación' }

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { membership, user } = useSession()
  const canWrite = can(membership?.role, 'inventory', 'write')
  const canAdmin = can(membership?.role, 'inventory', 'admin')

  const [asset, setAsset] = useState<AssetRecord | null>(null)
  const [assignments, setAssignments] = useState<AssetAssignment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [editing, setEditing] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [assignTarget, setAssignTarget] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!id || !membership) return
    const a = await getAsset(id)
    if (!a) return
    setAsset(a)
    setQrDataUrl(await generateAssetQrDataUrl(a.code))
    const [assign, maint, auditEntries, files, cats, locs, ars, ws] = await Promise.all([
      listAssignmentsForAsset(id),
      listMaintenanceForAsset(id),
      listAuditForRecord('assets', id),
      listAttachments('asset', id),
      listCategories(membership.organizationId),
      listLocations(membership.organizationId),
      listAreas(membership.organizationId),
      listWorkers(membership.organizationId),
    ])
    setAssignments(assign)
    setMaintenance(maint)
    setAudit(auditEntries)
    setAttachments(files)
    setCategories(cats)
    setLocations(locs)
    setAreas(ars)
    setWorkers(ws)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, membership?.organizationId])

  if (!asset) return <p>Cargando activo...</p>

  const openAssignment = assignments.find((a) => !a.returned_at)

  async function handleAssign() {
    if (!membership || !assignTarget) return
    await assignAssetToWorker(membership.organizationId, asset!.id, assignTarget, null, user?.id ?? null)
    setAssignTarget('')
    await refresh()
  }

  async function handleReturn() {
    if (!openAssignment) return
    await returnAsset(asset!.id, openAssignment.id)
    await refresh()
  }

  async function handleSoftDelete() {
    if (!asset) return
    if (!confirm(`Dar de baja el activo "${asset.name}" (${asset.code})? Queda en el historial, no se borra.`)) return
    try {
      await softDeleteAsset(asset)
      navigate('/inventario')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de baja el activo.')
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !membership || !asset) return
    setUploading(true)
    setError(null)
    try {
      await uploadAttachment(membership.organizationId, 'asset', asset.id, file, user?.id ?? null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el archivo.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleViewAttachment(att: Attachment) {
    const url = await getAttachmentUrl(att.file_path)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDeleteAttachment(att: Attachment) {
    if (!confirm(`Eliminar el adjunto "${att.file_name}"?`)) return
    await deleteAttachment(att)
    await refresh()
  }

  function handlePrintQr() {
    const win = window.open('', '_blank', 'width=320,height=420')
    if (!win) return
    win.document.write(`
      <html><head><title>QR ${asset!.code}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:1rem;">
        <img src="${qrDataUrl}" alt="QR ${asset!.code}" />
        <p>${asset!.code}<br/>${asset!.name}</p>
        <script>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  type TimelineEntry = { date: string; label: string }
  const timeline: TimelineEntry[] = [
    ...assignments.map((a) => ({
      date: a.assigned_at,
      label: `Asignado a ${workers.find((w) => w.id === a.worker_id)?.full_name ?? 'trabajador'}`,
    })),
    ...assignments.filter((a) => a.returned_at).map((a) => ({ date: a.returned_at as string, label: 'Devolución registrada' })),
    ...maintenance.map((m) => ({ date: m.date, label: `Mantenimiento ${m.type} (${m.status})` })),
    ...audit.map((a) => ({ date: a.created_at, label: ACTION_LABEL[a.action] ?? a.action })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div>
      <div className="app-topbar">
        <div>
          <h2 style={{ margin: 0 }}>{asset.name}</h2>
          <span style={{ color: 'var(--muted)' }}>{asset.code}</span>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={() => setEditing(true)}>
              Editar
            </button>
            {canAdmin && (
              <button className="btn danger" onClick={() => void handleSoftDelete()}>
                Dar de baja
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stat-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Información general</h3>
          <p><strong>Estado:</strong> {asset.status}</p>
          <p><strong>Categoría:</strong> {asset.category || '—'}</p>
          <p><strong>Ubicación:</strong> {asset.location || '—'}</p>
          <p><strong>Área:</strong> {asset.area || '—'}</p>
          <p><strong>Responsable:</strong> {asset.responsible || 'Sin asignar'}</p>
          <p><strong>Marca/Modelo:</strong> {[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}</p>
          <p><strong>Serial:</strong> {asset.serial || '—'}</p>
          <p><strong>Proveedor:</strong> {asset.provider || '—'}</p>
          <p><strong>Factura:</strong> {asset.invoiceNumber || '—'}</p>
          <p><strong>Costo:</strong> {asset.cost != null ? `$${asset.cost.toLocaleString('es-CO')}` : '—'}</p>
          <p><strong>Garantía hasta:</strong> {asset.warrantyUntil || '—'}</p>
          {asset.notes && <p><strong>Observaciones:</strong> {asset.notes}</p>}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>Código QR</h3>
          {qrDataUrl && <img src={qrDataUrl} alt={`QR ${asset.code}`} style={{ maxWidth: 180 }} />}
          <div>
            <button className="btn secondary" onClick={handlePrintQr} style={{ marginTop: '0.5rem' }}>
              Imprimir
            </button>
          </div>
        </div>

        {canWrite && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Asignación</h3>
            {openAssignment ? (
              <>
                <p>Asignado a <strong>{workers.find((w) => w.id === asset.workerId)?.full_name ?? asset.responsible}</strong></p>
                <button className="btn secondary" onClick={() => void handleReturn()}>
                  Registrar devolución
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="assignWorker">Asignar a</label>
                  <select id="assignWorker" value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}>
                    <option value="">Selecciona un trabajador</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn" disabled={!assignTarget} onClick={() => void handleAssign()}>
                  Asignar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Adjuntos y fotografías</h3>
        {canWrite && (
          <div style={{ marginBottom: '0.75rem' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => void handleUpload(e)} disabled={uploading} />
            {uploading && <span style={{ marginLeft: '0.5rem', color: 'var(--muted)' }}>Subiendo...</span>}
          </div>
        )}
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        {attachments.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin adjuntos todavía.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {attachments.map((att) => (
              <li key={att.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                <button className="btn secondary" onClick={() => void handleViewAttachment(att)}>
                  {att.file_name}
                </button>
                {canWrite && (
                  <button className="btn danger" onClick={() => void handleDeleteAttachment(att)}>
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Historial (inalterable)</h3>
        {timeline.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin movimientos registrados.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {timeline.map((t, i) => (
              <li key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{new Date(t.date).toLocaleString('es-CO')}</span>
                <div>{t.label}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && membership && (
        <AssetFormModal
          organizationId={membership.organizationId}
          initial={asset}
          categories={categories}
          locations={locations}
          areas={areas}
          workers={workers}
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            const updated = await updateAsset(asset, input)
            setAsset(updated)
            setEditing(false)
            await refresh()
          }}
        />
      )}
    </div>
  )
}
