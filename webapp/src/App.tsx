import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './core/auth/SessionContext'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { Layout } from './ui/Layout'
import { LoginPage } from './modules/auth/LoginPage'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { AssetsListPage } from './modules/inventory/AssetsListPage'
import { AssetDetailPage } from './modules/inventory/AssetDetailPage'
import { MaintenancePage } from './modules/inventory/MaintenancePage'
import { StockPage } from './modules/inventory/StockPage'
import { PhysicalCountPage } from './modules/inventory/PhysicalCountPage'
import { ReportsPage } from './modules/inventory/ReportsPage'
import { CatalogsPage } from './modules/catalogs/CatalogsPage'
import { WorkersPage } from './modules/workers/WorkersPage'
import { BirthdaysPage } from './modules/workers/BirthdaysPage'
import { NotificationSettingsPage } from './modules/workers/NotificationSettingsPage'

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
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/inventario" element={<Protected><AssetsListPage /></Protected>} />
          <Route path="/inventario/:id" element={<Protected><AssetDetailPage /></Protected>} />
          <Route path="/inventario/mantenimientos" element={<Protected><MaintenancePage /></Protected>} />
          <Route path="/inventario/consumibles" element={<Protected><StockPage /></Protected>} />
          <Route path="/inventario/conteo-fisico" element={<Protected><PhysicalCountPage /></Protected>} />
          <Route path="/inventario/reportes" element={<Protected><ReportsPage /></Protected>} />
          <Route path="/catalogos" element={<Protected><CatalogsPage /></Protected>} />
          <Route path="/trabajadores" element={<Protected><WorkersPage /></Protected>} />
          <Route path="/trabajadores/cumpleanos" element={<Protected><BirthdaysPage /></Protected>} />
          <Route path="/trabajadores/notificaciones" element={<Protected><NotificationSettingsPage /></Protected>} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}
