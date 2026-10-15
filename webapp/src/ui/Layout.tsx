import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../core/auth/SessionContext'
import { can, type ModuleKey } from '../core/rbac'
import { BrandMark } from './BrandMark'

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

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps(props)} width={20} height={20}>
      <path d="M3 5.5h14" />
      <path d="M3 10h14" />
      <path d="M3 14.5h14" />
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

function OrgSwitcher() {
  const { membership, memberships, switchOrganization, user } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="org-switcher" ref={ref}>
      <button type="button" className="org-switcher-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="app-header-org">
          <strong>{membership?.organizationName ?? 'Sin trabajo activo'}</strong>
          <span className="text-muted text-small">
            {user?.email} · rol: {membership?.role ?? '—'}
          </span>
        </div>
        <IconChevron aria-hidden="true" style={{ transform: open ? 'rotate(90deg)' : undefined }} />
      </button>
      {open && (
        <div className="org-switcher-menu">
          {memberships.map((m) => (
            <button
              key={m.organizationId}
              type="button"
              className={`org-switcher-item${m.organizationId === membership?.organizationId ? ' active' : ''}`}
              onClick={() => {
                switchOrganization(m.organizationId)
                setOpen(false)
              }}
            >
              {m.organizationName}
            </button>
          ))}
          <button
            type="button"
            className="org-switcher-item new-org"
            onClick={() => {
              setOpen(false)
              navigate('/trabajos/nuevo')
            }}
          >
            + Nuevo trabajo
          </button>
        </div>
      )}
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { membership, signOut } = useSession()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const canSee = (module: ModuleKey) => can(membership?.role, module, 'read')
  const visibleInventoryItems = canSee('inventory') ? INVENTORY_ITEMS : []
  const visibleIncidentItems = canSee('incidents') ? INCIDENT_ITEMS : []

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <div className={`app-sidebar-overlay${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
      <aside className={`app-sidebar${navOpen ? ' open' : ''}`}>
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
          <button
            type="button"
            className="app-menu-toggle"
            aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <IconMenu aria-hidden="true" />
          </button>
          <OrgSwitcher />
          <button className="btn secondary" onClick={() => void signOut()}>
            Cerrar sesion
          </button>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
