import { useEffect, useState, type ReactNode, type SVGProps } from 'react'
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

function iconProps(props: SVGProps<SVGSVGElement>) {
  return { width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props }
}

function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.3" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.3" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.3" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.3" />
    </svg>
  )
}

function IconBox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <path d="M2.5 6.2 10 2.5l7.5 3.7v7.6L10 17.5l-7.5-3.7z" />
      <path d="M2.5 6.2 10 9.7l7.5-3.5" />
      <path d="M10 9.7v7.8" />
    </svg>
  )
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="7.2" cy="6.6" r="2.6" />
      <path d="M2 16c.6-3 2.4-4.6 5.2-4.6s4.6 1.6 5.2 4.6" />
      <circle cx="14.6" cy="7.4" r="2.1" />
      <path d="M13.1 11.9c2.2.1 3.7 1.6 4.2 4.1" />
    </svg>
  )
}

function IconAlert(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="10" cy="10" r="7.3" />
      <path d="M10 6.3v4.4" />
      <circle cx="10" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)} className="chevron">
      <path d="M7 4l6 6-6 6" />
    </svg>
  )
}

function BrandMark() {
  return (
    <svg className="app-brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0b3b60" />
      <rect x="7" y="16" width="4.2" height="9" rx="1.2" fill="#0f8b8d" />
      <rect x="13.4" y="10" width="4.2" height="15" rx="1.2" fill="#0f8b8d" />
      <rect x="19.8" y="13.5" width="4.2" height="11.5" rx="1.2" fill="#5fd3c4" />
      <circle cx="24.5" cy="7.5" r="2.6" fill="#3ecf7a" />
    </svg>
  )
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `nav-link${isActive ? ' active' : ''}`
}

function NavGroup({
  id,
  label,
  icon,
  items,
  isActivePath,
  location,
}: {
  id: string
  label: string
  icon: ReactNode
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
        {icon}
        <span>{label}</span>
        <IconChevron aria-hidden="true" />
      </button>
      {open && (
        <div id={id} className="nav-subgroup">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === items[0].to} className={navLinkClass}>
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
        <div className="app-brand">
          <BrandMark />
          <div className="app-brand-text">
            <strong>UNOP</strong>
            <span>TI Hub</span>
          </div>
        </div>
        <nav>
          {canSee('dashboard') && (
            <NavLink to="/" end className={navLinkClass}>
              <IconDashboard aria-hidden="true" />
              Tablero
            </NavLink>
          )}

          <NavGroup
            id="nav-group-inventario"
            label="Inventario"
            icon={<IconBox aria-hidden="true" />}
            items={visibleInventoryItems}
            isActivePath={isInventoryPath}
            location={location.pathname}
          />

          {canSee('workers') && (
            <>
              <NavLink to="/trabajadores" end className={navLinkClass}>
                <IconUsers aria-hidden="true" />
                Trabajadores
              </NavLink>
              <div className="nav-subgroup">
                <NavLink to="/trabajadores/cumpleanos" className={navLinkClass}>Cumpleaños</NavLink>
                <NavLink to="/trabajadores/notificaciones" className={navLinkClass}>Notificaciones</NavLink>
              </div>
            </>
          )}

          <NavGroup
            id="nav-group-incidentes"
            label="Incidentes"
            icon={<IconAlert aria-hidden="true" />}
            items={visibleIncidentItems}
            isActivePath={isIncidentsPath}
            location={location.pathname}
          />
        </nav>
      </aside>
      <div>
        <header className="app-header">
          <div className="app-header-org">
            <strong>{membership?.organizationName ?? 'Sin organizacion'}</strong>
            <span className="text-muted text-small">
              {user?.email} · rol: {membership?.role ?? '—'}
            </span>
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
