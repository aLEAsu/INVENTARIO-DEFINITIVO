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
      <h2 style={{ marginTop: 0 }}>Tablero ejecutivo</h2>
      <div className="stat-grid">
        <div className="card stat-card">
          <strong>{counts?.total ?? '—'}</strong>
          <span>Activos totales</span>
        </div>
        <div className="card stat-card">
          <strong>{counts?.activos ?? '—'}</strong>
          <span>Operativos</span>
        </div>
        <div className="card stat-card">
          <strong>{counts?.asignados ?? '—'}</strong>
          <span>Asignados</span>
        </div>
        <div className="card stat-card">
          <strong>{counts?.mantenimiento ?? '—'}</strong>
          <span>En mantenimiento</span>
        </div>
      </div>
      <div className="card">
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Modulos de Trabajadores/Cumpleanos, Monitor de Puertos e Incidentes
          llegan en las siguientes fases. Este tablero se ira completando con
          sus indicadores a medida que se implementen.
        </p>
      </div>
    </div>
  )
}
