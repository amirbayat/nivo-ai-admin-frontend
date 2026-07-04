import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { PlansPage } from '@/pages/plans/PlansPage'
import { PaymentsPage } from '@/pages/payments/PaymentsPage'
import { FeedbackPage } from '@/pages/feedback/FeedbackPage'
import { TicketsPage } from '@/pages/tickets/TicketsPage'
import { ModelsPage } from '@/pages/models/ModelsPage'
import { ACCESS_KEY } from '@/lib/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(ACCESS_KEY)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="models" element={<ModelsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
