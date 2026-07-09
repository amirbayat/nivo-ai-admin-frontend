export interface AdminUser {
  id: string
  phone: string
  name: string | null
  role: 'USER' | 'ADMIN'
  isActive: boolean
  subscription: { plan: { name: string; priceMonthly: number }; periodEnd: string; periodStart: string } | null
  chargedThisMonth: number
  aiCostThisMonth: number
  aiCostUsdThisMonth: number
  expectedByNow: number
  category: 'heavy' | 'moderate' | 'light' | 'inactive'
}

export interface ExchangeRateInfo {
  toman: number
  updatedAt: string | null
  source: 'live' | 'fallback'
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  mrr: number
  totalConversations: number
  todayConversations: number
  exchangeRate: ExchangeRateInfo
}

export interface CostChartPoint {
  date: string
  aiCostToman: number
  aiCostUsd: number
  revenueToman: number
}

export interface PricingAlert {
  monthlyRevenueToman: number
  monthlyAiCostToman: number
  monthlyAiCostUsd: number
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
  rollingWindowLimit: number | null
  rollingWindowHours: number
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

// ── Usage Analytics ─────────────────────────────────────────────────────────

export interface AnalyticsOverviewData {
  totalTokens: number
  totalMessages: number
  costToman: number
  costUsd: number
  revenueToman: number
  marginToman: number
  marginPct: number | null
  avgTokensPerMessage: number
  avgInputTokensPerMessage: number
  avgOutputTokensPerMessage: number
  avgInputPricePerMillionUsd: number
  avgOutputPricePerMillionUsd: number
  avgInputPricePerMillionToman: number
  avgOutputPricePerMillionToman: number
  topModel: string | null
}

export interface AnalyticsOverview {
  current: AnalyticsOverviewData
  previous: AnalyticsOverviewData | null
  growth: {
    totalTokens: number | null
    totalMessages: number | null
    costToman: number | null
    revenueToman: number | null
  } | null
}

export interface AnalyticsTimeseriesPoint {
  date?: string
  period?: string
  tokens: number
  messages: number
  costToman: number
  costUsd: number
}

export interface AnalyticsModelBreakdown {
  model: string
  messages: number
  tokensInput: number
  tokensOutput: number
  costToman: number
  costUsd: number
  costInputUsd: number
  costOutputUsd: number
  costInputToman: number
  costOutputToman: number
  avgInputPricePerMillionUsd: number
  avgOutputPricePerMillionUsd: number
}

export interface AnalyticsTopicBreakdown {
  topicId: string | null
  name: string
  color: string | null
  messages: number
  pct: number
}

export interface AnalyticsLimitHits {
  byType: { type: string; count: number }[]
  uniqueUsers: number
}

export interface AnalyticsUserRow {
  userId: string
  phone: string | null
  name: string | null
  messages: number
  avgMessagesPerDay: number
  tokensInput: number
  tokensOutput: number
  avgTokensPerDay: number
  costToman: number
  costUsd: number
  revenueToman: number
  marginToman: number
  mostUsedModel: string | null
  segment: string | null
}

export interface AnalyticsSegmentBreakdown {
  label: string
  userCount: number
  avgMessagesPerDay: number
  medianMessagesPerDay: number
  p90MessagesPerDay: number
  avgTokensPerDay: number
  medianTokensPerDay: number
  p90TokensPerDay: number
  costToman: number
  costUsd: number
  revenueToman: number
  marginToman: number
  marginPct: number | null
}

export interface UserSegment {
  id: string
  label: string
  minMessagesPerDay: number | null
  maxMessagesPerDay: number | null
  minTokensPerDay: number | null
  maxTokensPerDay: number | null
  color: string | null
  sortOrder: number
  isActive: boolean
}

export interface Topic {
  id: string
  name: string
  keywords: string[]
  color: string | null
  sortOrder: number
  isActive: boolean
}

// ── Soft-Launch Waitlist Campaign ───────────────────────────────────────────

export interface ReminderStep {
  dayOffset: number
  template: string
}

export interface LaunchCampaign {
  id: string
  name: string
  startAt: string
  endAt: string | null
  capacity: number
  grantedCount: number
  maxWaitlistSize: number | null
  status: 'ACTIVE' | 'CLOSED'
  waitlistMessage: string
  waitlistFullMessage: string | null
  waitlistDailyMessageLimit: number
  displayCounterEnabled: boolean
  displayInitialPct: number
  displayFloor: number
  displayTickSeconds: number
  displayDecrementMin: number
  displayDecrementMax: number
  grantedSmsTemplate: string | null
  reminderSteps: ReminderStep[]
  createdAt: string
}

export interface WaitlistEntry {
  id: string
  campaignId: string
  userId: string
  phone: string
  status: 'WAITING' | 'GRANTED' | 'ACTIVATED'
  createdAt: string
  grantedAt: string | null
  activatedAt: string | null
  lastReminderStepSent: number | null
  lastReminderSentAt: string | null
}
