import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './core/auth/SessionContext'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { Layout } from './ui/Layout'
import { LoginPage } from './modules/auth/LoginPage'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { AssetsListPage } from './modules/inventory/AssetsListPage'

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/inventario"
            element={
              <Protected>
                <AssetsListPage />
              </Protected>
            }
          />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}
