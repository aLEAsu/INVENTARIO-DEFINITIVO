import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSession } from '../core/auth/SessionContext'
import { can, type ModuleKey } from '../core/rbac'

const INVENTORY_ITEMS = [
  { to: '/inventario', label: 'Activos' },
  { to: '/inventario/mantenimientos', label: 'Mantenimientos' },
  { to: '/inventario/consumibles', label: 'Consumibles' },
  { to: '/inventario/conteo-fisico', label: 'Inventario físico' },
  { to: '/inventario/reportes', label: 'Reportes' },
  { to: '/catalogos', label: 'Catálogos' },
]

const INCIDENT_ITEMS = [
  { to: '/incidentes', label: 'Incidentes' },
  { to: '/incidentes/base-conocimiento', label: 'Base de conocimiento' },
  { to: '/incidentes/panel', label: 'Panel de estado' },
  { to: '/incidentes/reportes', label: 'Reportes' },
]

const isInventoryPath = (pathname: string) => pathname.startsWith('/inventario') || pathname.startsWith('/catalogos')
const isIncidentsPath = (pathname: string) => pathname.startsWith('/incidentes')

function NavGroup({
  id,
  label,
  items,
  isActivePath,
  location,
}: {
  id: string
  label: string
  items: { to: string; label: string }[]
  isActivePath: (pathname: string) => boolean
  location: string
}) {
  const [open, setOpen] = useState(() => isActivePath(location))

  useEffect(() => {
    if (isActivePath(location)) setOpen(true)
  }, [location, isActivePath])

  if (items.length === 0) return null

  return (
    <div className="nav-group">
      <button type="button" className="nav-group-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div id={id} className="nav-subgroup">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === items[0].to}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { membership, user, signOut } = useSession()
  const location = useLocation()

  const canSee = (module: ModuleKey) => can(membership?.role, module, 'read')
  const visibleInventoryItems = canSee('inventory') ? INVENTORY_ITEMS : []
  const visibleIncidentItems = canSee('incidents') ? INCIDENT_ITEMS : []

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <h1>UNOP TI Hub</h1>
        <nav>
          {canSee('dashboard') && (
            <NavLink to="/" end>
              Tablero
            </NavLink>
          )}

          <NavGroup
            id="nav-group-inventario"
            label="Inventario"
            items={visibleInventoryItems}
            isActivePath={isInventoryPath}
            location={location.pathname}
          />

          {canSee('workers') && (
            <>
              <NavLink to="/trabajadores" end>
                Trabajadores
              </NavLink>
              <NavLink to="/trabajadores/cumpleanos">Cumpleaños</NavLink>
              <NavLink to="/trabajadores/notificaciones">Notificaciones</NavLink>
            </>
          )}

          <NavGroup
            id="nav-group-incidentes"
            label="Incidentes"
            items={visibleIncidentItems}
            isActivePath={isIncidentsPath}
            location={location.pathname}
          />
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
