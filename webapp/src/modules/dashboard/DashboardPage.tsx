import { useEffect, useState } from 'react'
import { supabase } from '../../core/supabaseClient'
import { useSession } from '../../core/auth/SessionContext'

interface Counts {
  total: number
  activos: number
  asignados: number
  mantenimiento: number
}

export function DashboardPage() {
  const { membership } = useSession()
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    if (!membership) return
    let active = true

    async function load() {
      const { data, error } = await supabase
        .from('assets')
        .select('status')
        .eq('organization_id', membership!.organizationId)

      if (!active) return
      if (error || !data) {
        setCounts({ total: 0, activos: 0, asignados: 0, mantenimiento: 0 })
        return
      }

      setCounts({
        total: data.length,
        activos: data.filter((a) => a.status === 'activo').length,
        asignados: data.filter((a) => a.status === 'asignado').length,
        mantenimiento: data.filter((a) => a.status === 'mantenimiento').length,
      })
    }

    void load()
    return () => {
      active = false
    }
  }, [membership])

  return (
    <div>
      <span className="eyebrow">Panel operativo</span>
      <h2>Tablero ejecutivo</h2>
      <div className="stat-grid" style={{ marginTop: '1.1rem' }}>
        <div className="card stat-card">
          <div>
            <strong>{counts?.total ?? '—'}</strong>
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
            <strong>{counts?.activos ?? '—'}</strong>
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
            <strong>{counts?.asignados ?? '—'}</strong>
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
            <strong>{counts?.mantenimiento ?? '—'}</strong>
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
      </div>
      <div className="card card-accent">
        <h3>Próximas fases</h3>
        <p className="text-muted">
          Modulos de Trabajadores/Cumpleanos, Monitor de Puertos e Incidentes
          llegan en las siguientes fases. Este tablero se ira completando con
          sus indicadores a medida que se implementen.
        </p>
      </div>
    </div>
  )
}
