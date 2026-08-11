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

const isInventoryPath = (pathname: string) => pathname.startsWith('/inventario') || pathname.startsWith('/catalogos')

export function Layout({ children }: { children: ReactNode }) {
  const { membership, user, signOut } = useSession()
  const location = useLocation()
  const [inventoryOpen, setInventoryOpen] = useState(() => isInventoryPath(location.pathname))

  useEffect(() => {
    if (isInventoryPath(location.pathname)) setInventoryOpen(true)
  }, [location.pathname])

  const canSee = (module: ModuleKey) => can(membership?.role, module, 'read')
  const visibleInventoryItems = canSee('inventory') ? INVENTORY_ITEMS : []

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

          {visibleInventoryItems.length > 0 && (
            <div className="nav-group">
              <button
                type="button"
                className="nav-group-toggle"
                aria-expanded={inventoryOpen}
                aria-controls="nav-group-inventario"
                onClick={() => setInventoryOpen((open) => !open)}
              >
                <span>Inventario</span>
                <span aria-hidden="true">{inventoryOpen ? '▾' : '▸'}</span>
              </button>
              {inventoryOpen && (
                <div id="nav-group-inventario" className="nav-subgroup">
                  {visibleInventoryItems.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.to === '/inventario'}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {canSee('workers') && <NavLink to="/trabajadores">Trabajadores</NavLink>}
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
