import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useSession } from '../core/auth/SessionContext'
import { can } from '../core/rbac'

const NAV_ITEMS = [
  { to: '/', label: 'Tablero', module: 'dashboard' as const },
  { to: '/inventario', label: 'Inventario y Activos', module: 'inventory' as const },
]

export function Layout({ children }: { children: ReactNode }) {
  const { membership, user, signOut } = useSession()

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <h1>UNOP TI Hub</h1>
        <nav>
          {NAV_ITEMS.filter((item) => can(membership?.role, item.module, 'read')).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <header className="app-topbar" style={{ padding: '1rem 1.5rem 0' }}>
          <div>
            <strong>{membership?.organizationName ?? 'Sin organizacion'}</strong>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {user?.email} · rol: {membership?.role ?? '—'}
            </div>
          </div>
          <button className="btn secondary" onClick={() => void signOut()}>
            Cerrar sesion
          </button>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
