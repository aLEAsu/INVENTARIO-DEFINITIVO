import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './core/auth/SessionContext'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { Layout } from './ui/Layout'
import { LoginPage } from './modules/auth/LoginPage'
import { NewOrganizationPage } from './modules/organizations/NewOrganizationPage'

// Cada pagina (y las librerias pesadas que solo ella usa -- jsPDF, html5-qrcode,
// write-excel-file) se descarga unicamente al visitar esa ruta, en vez de ir
// todas en el bundle principal. LoginPage/NewOrganizationPage quedan fuera de
// esto porque son lo primero que carga cualquier sesion nueva.
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AssetsListPage = lazy(() => import('./modules/inventory/AssetsListPage').then((m) => ({ default: m.AssetsListPage })))
const AssetDetailPage = lazy(() => import('./modules/inventory/AssetDetailPage').then((m) => ({ default: m.AssetDetailPage })))
const MaintenancePage = lazy(() => import('./modules/inventory/MaintenancePage').then((m) => ({ default: m.MaintenancePage })))
const StockPage = lazy(() => import('./modules/inventory/StockPage').then((m) => ({ default: m.StockPage })))
const PhysicalCountPage = lazy(() => import('./modules/inventory/PhysicalCountPage').then((m) => ({ default: m.PhysicalCountPage })))
const ReportsPage = lazy(() => import('./modules/inventory/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const CatalogsPage = lazy(() => import('./modules/catalogs/CatalogsPage').then((m) => ({ default: m.CatalogsPage })))
const WorkersPage = lazy(() => import('./modules/workers/WorkersPage').then((m) => ({ default: m.WorkersPage })))
const BirthdaysPage = lazy(() => import('./modules/workers/BirthdaysPage').then((m) => ({ default: m.BirthdaysPage })))
const NotificationSettingsPage = lazy(() =>
  import('./modules/workers/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })),
)
const IncidentsListPage = lazy(() => import('./modules/incidents/IncidentsListPage').then((m) => ({ default: m.IncidentsListPage })))
const IncidentDetailPage = lazy(() => import('./modules/incidents/IncidentDetailPage').then((m) => ({ default: m.IncidentDetailPage })))
const KnowledgeBasePage = lazy(() => import('./modules/incidents/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })))
const StatusPanelPage = lazy(() => import('./modules/incidents/StatusPanelPage').then((m) => ({ default: m.StatusPanelPage })))
const IncidentReportsPage = lazy(() =>
  import('./modules/incidents/IncidentReportsPage').then((m) => ({ default: m.IncidentReportsPage })),
)

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<div className="app-loading">Cargando...</div>}>{children}</Suspense>
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/trabajos/nuevo"
            element={
              <ProtectedRoute requireMembership={false}>
                <NewOrganizationPage />
              </ProtectedRoute>
            }
          />
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
          <Route path="/incidentes" element={<Protected><IncidentsListPage /></Protected>} />
          <Route path="/incidentes/:id" element={<Protected><IncidentDetailPage /></Protected>} />
          <Route path="/incidentes/base-conocimiento" element={<Protected><KnowledgeBasePage /></Protected>} />
          <Route path="/incidentes/panel" element={<Protected><StatusPanelPage /></Protected>} />
          <Route path="/incidentes/reportes" element={<Protected><IncidentReportsPage /></Protected>} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}
