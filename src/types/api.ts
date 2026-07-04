export interface AdminUser {
  id: string
  phone: string
  name: string | null
  role: 'USER' | 'ADMIN'
  isActive: boolean
  subscription: { plan: { name: string; priceMonthly: number }; periodEnd: string; periodStart: string } | null
  chargedThisMonth: number
  aiCostThisMonth: number
  expectedByNow: number
  category: 'heavy' | 'moderate' | 'light' | 'inactive'
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  mrr: number
  totalConversations: number
  todayConversations: number
}

export interface CostChartPoint {
  date: string
  aiCostRial: number
  revenueToman: number
}

export interface PricingAlert {
  monthlyRevenueToman: number
  monthlyAiCostRial: number
  aiCostRatio: number
  alertLevel: 'safe' | 'warning' | 'critical'
  suggestion: string | null
}

export interface ManualLimit {
  type: 'daily' | '1h' | '3h' | '6h'
  reason: string
  expiresAt: number
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

export interface ThrottleStep {
  afterMessages: number
  maxOutputTokens: number
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
  dailyMessageLimit: number | null
  throttledMessageCount: number | null
  throttledInputTokens: number | null
  throttledOutputTokens: number | null
  maxInputTokens: number
  outputThrottleSteps: ThrottleStep[]
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

export interface AdminTicket {
  id: string
  subject: string
  body: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  adminNote: string | null
  createdAt: string
  updatedAt: string
  user: { phone: string; name: string | null }
  replies: Array<{ id: string; fromAdmin: boolean; body: string; createdAt: string }>
}

export interface AiModel {
  id: string
  name: string
  displayName: string
  provider: string
  inputPricePerM: number
  outputPricePerM: number
  supportsVision: boolean
  isActive: boolean
  sortOrder: number
  tier: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'
  createdAt: string
}

export interface ModelFeedbackItem {
  id: string
  messageId: string
  userId: string
  vote: 'UP' | 'DOWN'
  comment: string | null
  modelUsed: string
  isChecked: boolean
  createdAt: string
  message: { content: string }
}

export interface ModelFeedbackTopIssue {
  model: string
  topic: string
  downCount: number
  upCount: number
  sampleComments: string[]
}

export interface ModelFeedbackSummary {
  id: string
  summary: string
  topIssues: ModelFeedbackTopIssue[]
  totalProcessed: number
  checkedUpTo: string
  createdAt: string
}
