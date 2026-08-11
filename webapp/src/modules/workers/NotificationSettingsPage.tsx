import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import {
  createRecipient,
  createTemplate,
  getSettings,
  listDeliveries,
  listRecipients,
  listTemplates,
  toggleRecipient,
  upsertSettings,
  type Delivery,
  type Recipient,
  type Template,
} from '../../data/repositories/notificationsRepo'

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  entregado: 'Entregado',
  leido: 'Leído',
  error: 'Error',
}

const STATUS_BADGE: Record<string, string> = {
  pendiente: 'badge-warning',
  enviado: 'badge-info',
  entregado: 'badge-success',
  leido: 'badge-success',
  error: 'badge-danger',
}

const APPROVAL_BADGE: Record<string, string> = {
  pendiente: 'badge-warning',
  aprobada: 'badge-success',
  rechazada: 'badge-danger',
}

export function NotificationSettingsPage() {
  const { membership } = useSession()
  const canManage = can(membership?.role, 'workers', 'admin')

  const [sendHour, setSendHour] = useState(8)
  const [feb29Policy, setFeb29Policy] = useState<'feb_28' | 'mar_1'>('feb_28')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [newPhone, setNewPhone] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateMetaName, setNewTemplateMetaName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!membership) return
    const orgId = membership.organizationId
    const [settings, rec, tpl, del] = await Promise.all([
      getSettings(orgId),
      listRecipients(orgId),
      listTemplates(orgId),
      listDeliveries(orgId),
    ])
    if (settings) {
      setSendHour(settings.send_hour_local)
      setFeb29Policy(settings.feb29_policy as 'feb_28' | 'mar_1')
    }
    setRecipients(rec)
    setTemplates(tpl)
    setDeliveries(del)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault()
    if (!membership) return
    await upsertSettings(membership.organizationId, { send_hour_local: sendHour, feb29_policy: feb29Policy, timezone: 'America/Bogota' })
  }

  async function handleAddRecipient(e: FormEvent) {
    e.preventDefault()
    if (!membership) return
    setError(null)
    try {
      await createRecipient(membership.organizationId, newPhone.trim(), newLabel.trim() || null)
      setNewPhone('')
      setNewLabel('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el destinatario. Verifica el formato E.164 (+573001234567).')
    }
  }

  async function handleAddTemplate(e: FormEvent) {
    e.preventDefault()
    if (!membership || !newTemplateName.trim() || !newTemplateMetaName.trim()) return
    await createTemplate(membership.organizationId, {
      name: newTemplateName,
      meta_template_name: newTemplateMetaName,
      language: 'es',
      variables: [],
      approval_status: 'pendiente',
    })
    setNewTemplateName('')
    setNewTemplateMetaName('')
    await refresh()
  }

  if (!canManage) {
    return <p className="text-muted">Solo owner/admin_ti pueden configurar notificaciones.</p>
  }

  return (
    <div>
      <span className="eyebrow">Talento humano</span>
      <h2>Notificaciones de cumpleaños</h2>
      <div className="notice notice-info" style={{ marginTop: '1.1rem' }}>
        El envío real por WhatsApp está en <strong>modo simulación</strong> hasta que se configuren las
        credenciales de Meta (ver docs/whatsapp-setup.md). Mientras tanto, cada envío queda registrado
        igual en el historial, marcado como simulado.
      </div>

      <div className="stat-grid">
        <form className="card" onSubmit={handleSaveSettings}>
          <h3>Configuración</h3>
          <div className="field">
            <label htmlFor="sendHour">Hora de envío (America/Bogota)</label>
            <input id="sendHour" type="number" min="0" max="23" value={sendHour} onChange={(e) => setSendHour(Number(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="feb29">Cumpleaños 29 de febrero (años no bisiestos)</label>
            <select id="feb29" value={feb29Policy} onChange={(e) => setFeb29Policy(e.target.value as 'feb_28' | 'mar_1')}>
              <option value="feb_28">Celebrar el 28 de febrero</option>
              <option value="mar_1">Celebrar el 1 de marzo</option>
            </select>
          </div>
          <button className="btn" type="submit">Guardar</button>
        </form>

        <form className="card" onSubmit={handleAddRecipient}>
          <h3>Destinatarios WhatsApp</h3>
          <div className="field">
            <label htmlFor="newPhone">Número (formato E.164)</label>
            <input id="newPhone" placeholder="+573001234567" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="newLabel">Etiqueta</label>
            <input id="newLabel" placeholder="Recursos Humanos" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          </div>
          {error && <p className="text-danger text-small">{error}</p>}
          <button className="btn" type="submit">Agregar</button>
          <ul className="divided-list" style={{ marginTop: '0.75rem' }}>
            {recipients.map((r) => (
              <li key={r.id} className="cluster-between">
                <span>{r.phone_e164} {r.label && `(${r.label})`}</span>
                <button type="button" className="btn secondary btn-sm" onClick={() => void toggleRecipient(r.id, !r.active).then(refresh)}>
                  {r.active ? 'Desactivar' : 'Activar'}
                </button>
              </li>
            ))}
          </ul>
        </form>
      </div>

      <form className="card" onSubmit={handleAddTemplate} style={{ marginBottom: '1rem' }}>
        <h3>Plantillas de WhatsApp (metadata)</h3>
        <p className="text-muted text-small">
          La plantilla real se crea y se aprueba en el panel de Meta Business. Aquí solo se registra
          para llevar el control de nombre/idioma/estado.
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="tplName">Nombre interno</label>
            <input id="tplName" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="tplMetaName">Nombre exacto en Meta</label>
            <input id="tplMetaName" value={newTemplateMetaName} onChange={(e) => setNewTemplateMetaName(e.target.value)} />
          </div>
        </div>
        <button className="btn" type="submit">Registrar plantilla</button>
        <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Nombre en Meta</th><th>Idioma</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td><td>{t.meta_template_name}</td><td>{t.language}</td>
                  <td><span className={`badge ${APPROVAL_BADGE[t.approval_status] ?? 'badge-neutral'}`}>{t.approval_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>

      <div className="card table-wrap">
        <h3>Historial de envíos</h3>
        {deliveries.length === 0 ? (
          <p className="text-muted">Todavía no hay envíos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Fecha</th><th>Estado</th><th>Reintentos</th><th>Motivo de error</th></tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td>{new Date(d.created_at).toLocaleString('es-CO')}</td>
                  <td><span className={`badge ${STATUS_BADGE[d.status] ?? 'badge-neutral'}`}>{STATUS_LABEL[d.status] ?? d.status}</span></td>
                  <td>{d.retry_count}</td>
                  <td>{d.error_reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
