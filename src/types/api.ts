export interface AdminUser {
  id: string
  phone: string
  name: string | null
  role: 'USER' | 'ADMIN'
  isActive: boolean
  subscription: { plan: { name: string }; periodEnd: string } | null
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  mrr: number
  totalConversations: number
  todayConversations: number
}

export interface AdminPayment {
  id: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  refId: string | null
  createdAt: string
  user: { phone: string }
  plan: { name: string }
}

export interface Plan {
  id: string
  name: string
  priceMonthly: number
  dailyFreeTokens: number
  monthlyTotalTokens: number
  allowedModels: string[]
  features: Record<string, unknown>
  isActive: boolean
  sortOrder: number
}

export interface FeedbackItem {
  id: string
  content: string
  category: string
  isChecked: boolean
  createdAt: string
  user: { phone: string } | null
}

export interface FeedbackSummary {
  summary: string
  topItems: { title: string; count: number; category: string }[]
  totalCount: number
  checkedUpTo: string
}

export interface TokenStats {
  today: { totalFree: number; totalPaid: number; requests: number }
  thisMonth: { totalFree: number; totalPaid: number }
}
