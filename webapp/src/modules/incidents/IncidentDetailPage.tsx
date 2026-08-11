import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import {
  changeIncidentStatus,
  getIncident,
  updateIncident,
  type Incident,
} from '../../data/repositories/incidentsRepo'
import { addComment, listIncidentUpdates, type IncidentUpdate } from '../../data/repositories/incidentUpdatesRepo'
import { completeIncidentAction, createIncidentAction, listIncidentActions, type IncidentAction } from '../../data/repositories/incidentActionsRepo'
import { getMySubscription, subscribe, unsubscribe } from '../../data/repositories/incidentSubscribersRepo'
import { listAttachments, uploadAttachment, type Attachment } from '../../data/repositories/attachmentsRepo'

const STATUS_OPTIONS = ['nuevo', 'clasificado', 'en_progreso', 'en_espera', 'resuelto', 'cerrado', 'reabierto']
const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo', clasificado: 'Clasificado', en_progreso: 'En progreso',
  en_espera: 'En espera', resuelto: 'Resuelto', cerrado: 'Cerrado', reabierto: 'Reabierto',
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { membership, user } = useSession()
  const canEdit = can(membership?.role, 'incidents', 'admin') || membership?.role === 'tecnico_ti'
  const canComment = can(membership?.role, 'incidents', 'write')

  const [incident, setIncident] = useState<Incident | null>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [actions, setActions] = useState<IncidentAction[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [subscribed, setSubscribed] = useState(false)
  const [comment, setComment] = useState('')
  const [visibility, setVisibility] = useState<'interno' | 'publico'>('publico')
  const [actionDesc, setActionDesc] = useState('')
  const [actionType, setActionType] = useState<'preventiva' | 'correctiva'>('correctiva')
  const [rootCause, setRootCause] = useState('')
  const [resolution, setResolution] = useState('')
  const [preventiveActions, setPreventiveActions] = useState('')

  async function refresh() {
    if (!id || !membership || !user) return
    const inc = await getIncident(id)
    if (!inc) return
    setIncident(inc)
    setRootCause(inc.root_cause ?? '')
    setResolution(inc.resolution ?? '')
    setPreventiveActions(inc.preventive_actions ?? '')
    const [ups, acts, files, sub] = await Promise.all([
      listIncidentUpdates(id),
      listIncidentActions(id),
      listAttachments('incident', id),
      getMySubscription(id, user.id),
    ])
    setUpdates(ups)
    setActions(acts)
    setAttachments(files)
    setSubscribed(!!sub)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, membership?.organizationId])

  if (!incident) return <p>Cargando...</p>

  const isCritical = incident.priority === 'P1' || incident.priority === 'P2'

  async function handleStatusChange(newStatus: string) {
    if (!incident || !user) return
    const updated = await changeIncidentStatus(incident, newStatus, user.id)
    setIncident(updated)
    await refresh()
  }

  async function handlePriorityChange(newPriority: string) {
    if (!incident) return
    const updated = await updateIncident(incident.id, { priority: newPriority })
    setIncident(updated)
  }

  async function handleSaveCriticalFields() {
    if (!incident) return
    const updated = await updateIncident(incident.id, {
      root_cause: rootCause || null,
      resolution: resolution || null,
      preventive_actions: preventiveActions || null,
    })
    setIncident(updated)
  }

  async function handleComment() {
    if (!membership || !incident || !comment.trim()) return
    await addComment(membership.organizationId, incident.id, comment, visibility, user?.id ?? null)
    setComment('')
    await refresh()
  }

  async function handleAddAction() {
    if (!membership || !incident || !actionDesc.trim()) return
    await createIncidentAction(membership.organizationId, incident.id, { type: actionType, description: actionDesc, responsible: null, due_date: null })
    setActionDesc('')
    await refresh()
  }

  async function toggleSubscription() {
    if (!membership || !incident || !user) return
    if (subscribed) await unsubscribe(incident.id, user.id)
    else await subscribe(membership.organizationId, incident.id, user.id)
    setSubscribed(!subscribed)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !membership || !incident) return
    await uploadAttachment(membership.organizationId, 'incident', incident.id, file, user?.id ?? null)
    e.target.value = ''
    await refresh()
  }

  type TimelineEntry = { date: string; label: string; kind: string }
  const timeline: TimelineEntry[] = [
    ...updates.map((u) => ({
      date: u.created_at,
      kind: u.status_to ? 'estado' : u.visibility,
      label: u.status_to ? `Estado: ${STATUS_LABEL[u.status_from ?? ''] ?? u.status_from} → ${STATUS_LABEL[u.status_to] ?? u.status_to}` : u.comment ?? '',
    })),
    ...actions.map((a) => ({ date: a.created_at, kind: 'accion', label: `Acción ${a.type}: ${a.description} (${a.status})` })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div>
      <div className="app-topbar">
        <div>
          <h2 style={{ margin: 0 }}>{incident.folio} — {incident.title}</h2>
        </div>
        <button className="btn secondary" onClick={() => void toggleSubscription()}>
          {subscribed ? 'Dejar de seguir' : 'Seguir este incidente'}
        </button>
      </div>

      {isCritical && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          Incidente {incident.priority} — completa causa raíz, solución y acciones preventivas antes de cerrarlo.
        </div>
      )}

      <div className="stat-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Clasificación</h3>
          <div className="field">
            <label htmlFor="status">Estado</label>
            <select id="status" value={incident.status} disabled={!canEdit} onChange={(e) => void handleStatusChange(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priority">Prioridad</label>
            <select id="priority" value={incident.priority} disabled={!canEdit} onChange={(e) => void handlePriorityChange(e.target.value)}>
              <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option>
            </select>
          </div>
          {incident.description && <p><strong>Descripción:</strong> {incident.description}</p>}
        </div>

        {isCritical && canEdit && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Seguimiento crítico</h3>
            <div className="field">
              <label htmlFor="rootCause">Causa raíz</label>
              <textarea id="rootCause" rows={2} value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="resolution">Solución</label>
              <textarea id="resolution" rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="preventive">Acciones preventivas</label>
              <textarea id="preventive" rows={2} value={preventiveActions} onChange={(e) => setPreventiveActions(e.target.value)} />
            </div>
            <button className="btn secondary" onClick={() => void handleSaveCriticalFields()}>Guardar</button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Adjuntos</h3>
        {canComment && <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => void handleUpload(e)} />}
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
          {attachments.map((a) => <li key={a.id}>{a.file_name}</li>)}
        </ul>
      </div>

      {canEdit && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Acción preventiva/correctiva</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="actionType">Tipo</label>
              <select id="actionType" value={actionType} onChange={(e) => setActionType(e.target.value as 'preventiva' | 'correctiva')}>
                <option value="correctiva">Correctiva</option>
                <option value="preventiva">Preventiva</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="actionDesc">Descripción</label>
              <input id="actionDesc" value={actionDesc} onChange={(e) => setActionDesc(e.target.value)} />
            </div>
          </div>
          <button className="btn secondary" onClick={() => void handleAddAction()}>Registrar acción</button>
          {actions.filter((a) => a.status === 'pendiente').map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span>{a.description}</span>
              <button className="btn secondary" onClick={() => void completeIncidentAction(a.id).then(refresh)}>Marcar completada</button>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Agregar comentario</h3>
          <div className="field">
            <label htmlFor="comment">Comentario</label>
            <textarea id="comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          {canEdit && (
            <div className="field">
              <label htmlFor="visibility">Visibilidad</label>
              <select id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value as 'interno' | 'publico')}>
                <option value="publico">Visible para el equipo</option>
                <option value="interno">Solo interno (TI)</option>
              </select>
            </div>
          )}
          <button className="btn" onClick={() => void handleComment()} disabled={!comment.trim()}>Comentar</button>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Bitácora</h3>
        {timeline.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin actividad todavía.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {timeline.map((t, i) => (
              <li key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{new Date(t.date).toLocaleString('es-CO')}</span>
                {t.kind === 'interno' && <span className="badge" style={{ marginLeft: '0.4rem' }}>Interno</span>}
                <div>{t.label}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
