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
  isPopular: boolean
  featuredModels: string[]
  featuredModelsCount: number
  dailyMessageLimit: number | null
  throttledMessageCount: number | null
  throttledInputTokens: number | null
  throttledOutputTokens: number | null
  maxInputTokens: number
  outputThrottleSteps: ThrottleStep[]
  rollingWindowLimit: number | null
  rollingWindowHours: number
  simpleModel: string | null
  contextMd: string | null
  trialMessageThreshold: number | null
  trialDailyMessageLimit: number | null
  trialThrottledMessageCount: number | null
  trialRollingWindowLimit: number | null
  trialRollingWindowHours: number | null
}

export type DiscountSource = 'WELCOME_GIFT' | 'EXPIRY_REMINDER' | 'REFERRAL' | 'MANUAL'

export interface DiscountCode {
  id: string
  code: string
  discountPercent: number
  source: DiscountSource
  issuedToUserId: string | null
  issuedToUser: { phone: string; name: string | null } | null
  maxUses: number
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export interface GrowthConfig {
  id: string
  welcomeDiscountPercent: number
  welcomeDiscountValidHours: number
  expiryDiscountPercent: number
  referralDiscountPercent: number
  referralDiscountValidDays: number
  updatedAt: string
}

export interface OnboardingGift {
  id: string
  title: string
  description: string
  audioUrl: string | null
  isActive: boolean
  updatedAt: string
}

export interface ChatConfig {
  id: string
  globalContextMd: string
  summaryTriggerTokens: number
  summaryMaxTokens: number
  updatedAt: string
}

export interface RoutingStep {
  order: number
  thresholdPct: number
  models: string[]
}

export interface PlanRouting {
  simpleModel: string | null
  steps: RoutingStep[]
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

export type AiModelType = 'CHAT' | 'EMBEDDING'

export interface AiModel {
  id: string
  name: string
  displayName: string
  provider: string
  modelType: AiModelType
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

// ─── Sales Bot (docs/PRD-sales-bot-dashboard.md) ───────────────────────────────

export interface SalesBotConfig {
  id: string
  contextMd: string
  model: string
  embeddingModel: string
  maxOutputTokens: number
  maxMessages: number
  discountEnabled: boolean
  discountMinMessages: number
  discountPromptText: string
  updatedAt: string
}

export interface SalesBotAnalyticsOverview {
  totalMessages: number
  totalTokensInput: number
  totalTokensOutput: number
  totalTokens: number
  costToman: number
  costUsd: number
  sessionsStarted: number
  discountOffersShown: number
  phonesCaptured: number
  discountConversionRate: number | null
  embeddingCalls: number
  embeddingTokens: number
  embeddingCostToman: number
  embeddingCostUsd: number
  ctaFreeStartClicks: number
  ctaPricingClicks: number
}

export interface SalesBotAnalyticsPoint {
  date: string
  messages: number
  tokens: number
  costToman: number
}

export type LeadFollowUpStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DECLINED'

export interface LeadProfile {
  id: string
  sessionId: string | null
  phone: string | null
  name: string | null
  age: number | null
  city: string | null
  jobTitle: string | null
  interests: string[] | null
  chatHistory: { role: 'user' | 'assistant'; content: string }[] | null
  recommendedPlan: string | null
  source: string
  discountOffered: boolean
  followUpStatus: LeadFollowUpStatus
  guideContentMd: string | null
  guideSentAt: string | null
  createdAt: string
}

export interface LeadProfileList {
  items: LeadProfile[]
  total: number
  page: number
  limit: number
}

// ─── Sales Knowledge Base / RAG (docs/PRD-sales-kb-rag-and-plan-context.md بخش الف) ─────

export type SalesKbKind = 'EXAMPLE' | 'OBJECTION' | 'FAQ' | 'PERSONA_GUIDANCE'

export interface SalesKbEntry {
  id: string
  kind: SalesKbKind
  label: string
  tags: string[]
  userMessage: string
  assistantReply: string
  note: string | null
  isActive: boolean
  embeddingModel: string | null
  createdAt: string
  updatedAt: string
}

export interface SalesKbEntryInput {
  kind: SalesKbKind
  label: string
  tags?: string[]
  userMessage: string
  assistantReply: string
  note?: string
  isActive?: boolean
}

export interface BulkImportSalesKbResult {
  created: number
  failed: number
  errors: string[]
}

export interface SalesKbRetrievalDebugResult {
  id: string
  userMessage: string
  score: number
}

export interface RecomputeEmbeddingsResult {
  updated: number
  failed: number
}

export interface SalesChatSession {
  id: string
  sessionId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  messageCount: number
  createdAt: string
  lastMessageAt: string
}

export interface SalesChatSessionList {
  items: SalesChatSession[]
  total: number
  page: number
  limit: number
}

export interface SalesKbDraftEntry {
  kind: 'EXAMPLE'
  label: string
  tags: string[]
  userMessage: string
  assistantReply: string
}

// ─── مقالات (SEO) — docs/PRD-articles-seo-blog.md ──────────────────────────────

export interface ArticleCategory {
  id: string
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED'

export interface Article {
  id: string
  slug: string
  title: string
  metaDescription: string | null
  coverImageUrl: string | null
  contentMd: string
  categoryId: string | null
  category: ArticleCategory | null
  status: ArticleStatus
  isPinnedInBanner: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleCategoryInput {
  name: string
  slug?: string
  sortOrder?: number
  isActive?: boolean
}

export interface ArticleInput {
  title: string
  slug?: string
  metaDescription?: string
  coverImageUrl?: string
  contentMd: string
  categoryId?: string
  status?: ArticleStatus
  isPinnedInBanner?: boolean
}

export interface ActiveOtp {
  phone: string
  code: string
  name: string | null
  expiresInSeconds: number
}
