import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from './SessionContext'

/** `requireMembership=false` para rutas accesibles con sesion pero sin
 * ningun trabajo (organizacion) todavia, como la de crear el primero. */
export function ProtectedRoute({ children, requireMembership = true }: { children: ReactNode; requireMembership?: boolean }) {
  const { loading, session, membership } = useSession()
  const location = useLocation()

  if (loading) {
    return <div className="app-loading">Cargando sesion...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (requireMembership && !membership && location.pathname !== '/trabajos/nuevo') {
    return <Navigate to="/trabajos/nuevo" replace />
  }

  return <>{children}</>
}
