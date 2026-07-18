import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminLayout } from '@/layout/AdminLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { PlansPage } from '@/pages/plans/PlansPage'
import { PaymentsPage } from '@/pages/payments/PaymentsPage'
import { FeedbackPage } from '@/pages/feedback/FeedbackPage'
import { TicketsPage } from '@/pages/tickets/TicketsPage'
import { ModelsPage } from '@/pages/models/ModelsPage'
import { ModelRoutingPage } from '@/pages/model-routing/ModelRoutingPage'
import { ModelFeedbackPage } from '@/pages/model-feedback/ModelFeedbackPage'
import { ChatConfigPage } from '@/pages/chat-config/ChatConfigPage'
import { GrowthPage } from '@/pages/growth/GrowthPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { CampaignsPage } from '@/pages/campaigns/CampaignsPage'
import { SalesBotPage } from '@/pages/sales-bot/SalesBotPage'
import { ArticlesPage } from '@/pages/articles/ArticlesPage'
import { ArticleCategoriesPage } from '@/pages/articles/ArticleCategoriesPage'
import { OtpListPage } from '@/pages/otp/OtpListPage'
import { LiveStatsPage } from '@/pages/live-stats/LiveStatsPage'
import { NetworkOutagePage } from '@/pages/network-outage/NetworkOutagePage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { ACCESS_KEY } from '@/lib/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(ACCESS_KEY)
  const location = useLocation()
  if (!token) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* docs/PRD-admin-notifications-and-mobile.md بخش ۶ — روت مستقل بدون AdminLayout، برای
          WebView اپ موبایل ادمین (بدون Sider/Header دسکتاپ) */}
      <Route
        path="/embedded/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage embedded />
          </ProtectedRoute>
        }
      />
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
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="model-routing" element={<ModelRoutingPage />} />
        <Route path="model-feedback" element={<ModelFeedbackPage />} />
        <Route path="chat-config" element={<ChatConfigPage />} />
        <Route path="growth" element={<GrowthPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="sales-bot" element={<SalesBotPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="article-categories" element={<ArticleCategoriesPage />} />
        <Route path="otp" element={<OtpListPage />} />
        <Route path="live-stats" element={<LiveStatsPage />} />
        <Route path="network-outage" element={<NetworkOutagePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
