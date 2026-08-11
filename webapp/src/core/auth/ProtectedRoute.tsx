import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from './SessionContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session, membership } = useSession()

  if (loading) {
    return <div className="app-loading">Cargando sesion...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!membership) {
    return (
      <div className="app-loading">
        Tu usuario no pertenece a ninguna organizacion todavia. Pide a un
        administrador que te agregue en organization_members.
      </div>
    )
  }

  return <>{children}</>
}
