import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../core/auth/SessionContext'
import { applyBlueprintToOrganization, listAvailableBlueprints, type TradeBlueprint } from '../../data/repositories/blueprintsRepo'

export function NewOrganizationPage() {
  const { memberships, createOrganization } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [blueprints, setBlueprints] = useState<TradeBlueprint[]>([])
  const [blueprintId, setBlueprintId] = useState<string>('')
  const [loadingBlueprints, setLoadingBlueprints] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    listAvailableBlueprints()
      .then((list) => {
        if (!active) return
        setBlueprints(list)
        setBlueprintId((current) => current || list[0]?.id || '')
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los blueprints disponibles.')
      })
      .finally(() => {
        if (active) setLoadingBlueprints(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Ponle un nombre al trabajo (por ejemplo, el nombre del cliente o del sitio).')
      return
    }

    setSubmitting(true)
    try {
      const { organizationId, error: createError } = await createOrganization(name.trim())
      if (createError || !organizationId) {
        setError(createError ?? 'No se pudo crear el trabajo.')
        return
      }
      if (blueprintId) {
        await applyBlueprintToOrganization(organizationId, blueprintId)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar el blueprint elegido.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="card auth-card onboarding-card">
        <div className="auth-brand">
          <svg className="app-brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0b3b60" />
            <rect x="7" y="16" width="4.2" height="9" rx="1.2" fill="#0f8b8d" />
            <rect x="13.4" y="10" width="4.2" height="15" rx="1.2" fill="#0f8b8d" />
            <rect x="19.8" y="13.5" width="4.2" height="11.5" rx="1.2" fill="#5fd3c4" />
            <circle cx="24.5" cy="7.5" r="2.6" fill="#3ecf7a" />
          </svg>
          <div>
            <strong>{memberships.length === 0 ? 'Crea tu primer trabajo' : 'Nuevo trabajo'}</strong>
            <span>Cada trabajo (cliente, sitio, contrato) tiene su propio inventario, equipo e incidentes.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="org-name">Nombre del trabajo</label>
          <input
            id="org-name"
            type="text"
            required
            placeholder="Ej: Clinica San Rafael, Obra Torre Norte..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Punto de partida</label>
          {loadingBlueprints ? (
            <p className="text-muted text-small">Cargando blueprints...</p>
          ) : (
            <div className="blueprint-grid">
              {blueprints.map((bp) => (
                <label key={bp.id} className="blueprint-option">
                  <input
                    type="radio"
                    name="blueprint"
                    value={bp.id}
                    checked={blueprintId === bp.id}
                    onChange={() => setBlueprintId(bp.id)}
                  />
                  <strong>{bp.name}</strong>
                  <span>{bp.description ?? 'Blueprint personal.'}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-muted text-small">
            Trae las categorías, campos personalizados y tipos de incidente de ese rubro. Puedes
            ajustarlo todo despues desde Catálogos y Configuración.
          </p>
        </div>

        {error && <p className="text-danger text-small">{error}</p>}

        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creando trabajo...' : 'Crear trabajo'}
        </button>

        {memberships.length > 0 && (
          <button
            type="button"
            className="btn ghost"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
        )}
      </form>
    </div>
  )
}
