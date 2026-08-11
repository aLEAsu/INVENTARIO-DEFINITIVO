import { useEffect, useMemo, useState } from 'react'
import { useSession } from '../../core/auth/SessionContext'
import { can } from '../../core/rbac'
import { listBirthdays, type BirthdayEntry } from '../../data/repositories/birthdaysRepo'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function daysUntilNext(month: number, day: number, today: Date): number {
  const year = today.getFullYear()
  let target = new Date(year, month - 1, day)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (target < todayMidnight) target = new Date(year + 1, month - 1, day)
  return Math.round((target.getTime() - todayMidnight.getTime()) / 86400000)
}

export function BirthdaysPage() {
  const { membership } = useSession()
  const canSeeYear = can(membership?.role, 'workers', 'admin') || membership?.role === 'talento_humano'
  const [entries, setEntries] = useState<BirthdayEntry[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const today = new Date()

  useEffect(() => {
    if (!membership) return
    void listBirthdays(membership.organizationId).then(setEntries)
  }, [membership?.organizationId])

  const upcoming = useMemo(() => {
    return [...entries]
      .filter((e) => e.birth_month && e.birth_day)
      .map((e) => ({ ...e, daysUntil: daysUntilNext(e.birth_month!, e.birth_day!, today) }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10)
  }, [entries])

  const monthEntries = useMemo(
    () => entries.filter((e) => e.birth_month === month).sort((a, b) => (a.birth_day ?? 0) - (b.birth_day ?? 0)),
    [entries, month],
  )

  function formatDate(e: BirthdayEntry): string {
    const dm = `${e.birth_day}/${e.birth_month}`
    if (canSeeYear && e.birth_date_full) {
      const year = e.birth_date_full.slice(0, 4)
      return `${dm}/${year}`
    }
    return dm
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Cumpleaños</h2>
      {!canSeeYear && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Por tu rol solo ves día y mes; el año de nacimiento está protegido.
        </p>
      )}

      <div className="stat-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Próximos cumpleaños</h3>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Nadie ha dado su consentimiento para aparecer aquí todavía.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {upcoming.map((e) => (
                <li key={e.worker_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{e.full_name}</span>
                  <span style={{ color: 'var(--muted)' }}>
                    {formatDate(e)} · {e.daysUntil === 0 ? 'hoy' : e.daysUntil === 1 ? 'mañana' : `en ${e.daysUntil} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Calendario mensual</h3>
          <div className="field">
            <label htmlFor="monthSelect">Mes</label>
            <select id="monthSelect" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {monthEntries.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Sin cumpleaños registrados en {MONTH_NAMES[month - 1]}.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {monthEntries.map((e) => (
                <li key={e.worker_id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--line)' }}>
                  <strong>{e.birth_day}</strong> — {e.full_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
