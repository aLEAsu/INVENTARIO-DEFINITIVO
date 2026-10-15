import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../core/supabaseClient'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { listIncidents } from '../../data/repositories/incidentsRepo'

interface AssetCounts {
  total: number
  activos: number
  asignados: number
  mantenimiento: number
}

interface BlueprintInfo {
  name: string
  appliedAt: string
}

const OPEN_INCIDENT_STATUSES = new Set(['nuevo', 'clasificado', 'en_progreso', 'en_espera', 'reabierto'])

export function DashboardPage() {
  const { membership } = useSession()
  const canSeeIncidents = can(membership?.role, 'incidents', 'read')

  const [assetCounts, setAssetCounts] = useState<AssetCounts | null>(null)
  const [openIncidents, setOpenIncidents] = useState<number | null>(null)
  const [blueprint, setBlueprint] = useState<BlueprintInfo | null>(null)

  useEffect(() => {
    if (!membership) return
    let active = true
    const orgId = membership.organizationId

    async function load() {
      const { data: assets } = await supabase.from('assets').select('status').eq('organization_id', orgId)
      if (!active) return
      setAssetCounts({
        total: assets?.length ?? 0,
        activos: assets?.filter((a) => a.status === 'activo').length ?? 0,
        asignados: assets?.filter((a) => a.status === 'asignado').length ?? 0,
        mantenimiento: assets?.filter((a) => a.status === 'mantenimiento').length ?? 0,
      })

      if (canSeeIncidents) {
        const incidents = await listIncidents(orgId)
        if (!active) return
        setOpenIncidents(incidents.filter((i) => OPEN_INCIDENT_STATUSES.has(i.status)).length)
      }

      const { data: applications } = await supabase
        .from('organization_blueprint_applications')
        .select('blueprint_name_snapshot, applied_at')
        .eq('organization_id', orgId)
        .order('applied_at', { ascending: false })
        .limit(1)
      if (!active) return
      const latest = applications?.[0]
      setBlueprint(latest ? { name: latest.blueprint_name_snapshot, appliedAt: latest.applied_at } : null)
    }

    void load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership?.organizationId])

  return (
    <div>
      <span className="eyebrow">Tablero</span>
      <h2>{membership?.organizationName ?? 'Trabajo activo'}</h2>

      <div className="stat-grid" style={{ marginTop: '1.1rem' }}>
        <div className="card stat-card">
          <div>
            <strong>
              {assetCounts?.total ?? '—'}
              <span className="stat-cursor" aria-hidden="true" />
            </strong>
            <span>Activos totales</span>
          </div>
          <span className="stat-icon" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.2 10 2.5l7.5 3.7v7.6L10 17.5l-7.5-3.7z" />
              <path d="M2.5 6.2 10 9.7l7.5-3.5" />
              <path d="M10 9.7v7.8" />
            </svg>
          </span>
        </div>
        <div className="card stat-card">
          <div>
            <strong>{assetCounts?.activos ?? '—'}</strong>
            <span>Operativos</span>
          </div>
          <span className="stat-icon success" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10.5l3.6 3.6L16 6" />
            </svg>
          </span>
        </div>
        <div className="card stat-card">
          <div>
            <strong>{assetCounts?.asignados ?? '—'}</strong>
            <span>Asignados</span>
          </div>
          <span className="stat-icon" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.2" cy="6.6" r="2.6" />
              <path d="M2 16c.6-3 2.4-4.6 5.2-4.6s4.6 1.6 5.2 4.6" />
              <circle cx="14.6" cy="7.4" r="2.1" />
              <path d="M13.1 11.9c2.2.1 3.7 1.6 4.2 4.1" />
            </svg>
          </span>
        </div>
        <div className="card stat-card">
          <div>
            <strong>{assetCounts?.mantenimiento ?? '—'}</strong>
            <span>En mantenimiento</span>
          </div>
          <span className="stat-icon warning" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3 2.8 16h14.4z" />
              <path d="M10 8.4v3.6" />
              <circle cx="10" cy="14" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </div>
        {canSeeIncidents && (
          <div className="card stat-card">
            <div>
              <strong>{openIncidents ?? '—'}</strong>
              <span>Incidentes abiertos</span>
            </div>
            <span className="stat-icon danger" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="7.3" />
                <path d="M10 6.3v4.4" />
                <circle cx="10" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
              </svg>
            </span>
          </div>
        )}
      </div>

      <div className="card card-accent">
        <h3>Este trabajo</h3>
        <p className="text-muted">
          {membership?.role === 'owner' ? 'Eres el responsable de' : 'Perteneces a'}{' '}
          <strong>{membership?.organizationName}</strong> con rol <strong>{membership?.role}</strong>.
          {blueprint && (
            <>
              {' '}Configurado a partir del blueprint <strong>{blueprint.name}</strong> el{' '}
              {new Date(blueprint.appliedAt).toLocaleDateString('es-CO')}.
            </>
          )}
        </p>
        <div className="cluster" style={{ marginTop: '0.8rem' }}>
          <Link to="/inventario" className="btn secondary btn-sm">Ver inventario</Link>
          {canSeeIncidents && <Link to="/incidentes" className="btn secondary btn-sm">Ver incidentes</Link>}
          <Link to="/trabajadores" className="btn secondary btn-sm">Ver trabajadores</Link>
        </div>
      </div>
    </div>
  )
}
