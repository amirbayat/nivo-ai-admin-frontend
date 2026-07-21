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
  aiCostTextThisMonth: number
  aiCostImageThisMonth: number
  aiCostTextUsdThisMonth: number
  aiCostImageUsdThisMonth: number
  expectedByNow: number
  category: 'heavy' | 'moderate' | 'light' | 'inactive'
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: 'CREDIT' | 'DEBIT'
  amountToman: number
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface UserDetailPayment {
  id: string
  kind: 'SUBSCRIPTION' | 'WALLET_TOPUP'
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  provider: string
  createdAt: string
  plan: { name: string } | null
}

export interface UserDailyUsageRow {
  id: string
  date: string
  freeTokensUsed: number
  paidTokensUsed: number
  requestsCount: number
  costToman: number
  costUsdMicros: number
}

export interface AdminUserDetail {
  user: {
    id: string
    phone: string
    name: string | null
    role: 'USER' | 'ADMIN'
    isActive: boolean
    createdAt: string
    lifetimeMessageCount: number
    subscription: { status: string; periodStart: string; periodEnd: string; plan: Plan } | null
    wallet: { id: string; balanceToman: number } | null
  }
  walletBalanceToman: number
  walletTransactions: WalletTransaction[]
  payments: UserDetailPayment[]
  dailyUsage: UserDailyUsageRow[]
  textUsage: AnalyticsUserTypeUsage
  imageUsage: AnalyticsUserTypeUsage
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
  // null یعنی هنوز کلید اختصاصی لیارا برای کاربری در آن روز فعال نبوده — نه هزینه‌ی صفر
  liaraCostToman: number | null
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
  reasoningEffort: string | null
  fastReasoningEffort: string | null
  smartReasoningEffort: string | null
  contextMd: string | null
  trialMessageThreshold: number | null
  trialDailyMessageLimit: number | null
  trialThrottledMessageCount: number | null
  trialRollingWindowLimit: number | null
  trialRollingWindowHours: number | null
  isPayAsYouGo: boolean
  payAsYouGoMarkup: number | null
  payAsYouGoMinActivationToman: number | null
  payAsYouGoMinTopupToman: number | null
  payAsYouGoTopupPresets: number[] | null
  defaultImageGenModel: string | null
  maxImageGenPerDay: number | null
  maxImageGenPerWindow: number | null
  imageGenWindowHours: number | null
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
  postTrialGraceHours: number
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
  maxImagesPerMessage: number
  maxImageSizeMb: number
  allowedImageFormats: string[]
  implicitImageGenEnabled: boolean
  updatedAt: string
}

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high'

export interface RoutingStep {
  order: number
  thresholdPct: number
  models: string[]
  reasoningEffort?: ReasoningEffort | null
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

export type AiModelType = 'CHAT' | 'EMBEDDING' | 'IMAGE_GEN'

export interface AiModel {
  id: string
  name: string
  displayName: string
  provider: string
  modelType: AiModelType
  inputPricePerM: number
  outputPricePerM: number
  supportsVision: boolean
  supportsImageGen: boolean
  imageGenInputImagePricePerM: number | null
  imageGenOutputImagePricePerM: number | null
  imageGenQuality: string | null
  imageGenSize: string | null
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

export interface AnalyticsModelTypeBreakdown {
  messages: number
  totalTokens: number
  avgTokensPerMessage: number
  avgInputTokensPerMessage: number
  avgOutputTokensPerMessage: number
  avgInputPricePerMillionUsd: number
  avgOutputPricePerMillionUsd: number
  avgInputPricePerMillionToman: number
  avgOutputPricePerMillionToman: number
  topModel: string | null
}

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
  text: AnalyticsModelTypeBreakdown
  image: AnalyticsModelTypeBreakdown
  // docs/PRD-liara-usage-reconciliation.md — مصرف واقعیِ گزارش‌شده توسط لیارا (کلیدهای اختصاصی
  // کاربران) در برابر costToman بالا (محاسبه‌ی داخلی). liaraMatchPct=null یعنی هنوز داده‌ای
  // برای این بازه نداریم، نه ۰٪.
  liaraRealCostToman: number
  liaraMatchPct: number | null
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
  modelType: 'TEXT' | 'IMAGE'
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

export interface AnalyticsUserTypeUsage {
  messages: number
  tokensInput: number
  tokensOutput: number
  costToman: number
  costUsd: number
  mostUsedModel: string | null
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
  text: AnalyticsUserTypeUsage
  image: AnalyticsUserTypeUsage
  // docs/PRD-liara-usage-reconciliation.md — null یعنی هنوز LiaraUsageSnapshot ای برای این
  // کاربر/بازه نداریم (نمایش «—»)، نه صفر واقعی.
  liaraRealCostToman: number | null
  liaraRequestCount: number
  liaraMatchPct: number | null
}

// docs/PRD-liara-usage-reconciliation.md — کاربرانی که الان به‌خاطر خطا (مثلاً JWT مدیریتی
// منقضی/نامعتبر) روی کلید مشترک fallback هستند
export interface LiaraProvisioningIssue {
  userId: string
  phone: string | null
  name: string | null
  lastError: string
  attemptCount: number
  firstFailedAt: string
  lastAttemptAt: string
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
  displayInitialPctMin: number
  displayInitialPctMax: number
  displayFloorMin: number
  displayFloorMax: number
  displayAnimationTickMs: number
  displayDecrementMin: number
  displayDecrementMax: number
  grantedSmsTemplate: string | null
  reminderSteps: ReminderStep[]
  createdAt: string
}

export interface NetworkOutage {
  id: string
  startedAt: string
  endedAt: string | null
  extendedDays: number | null
  affectedCount: number | null
  createdByAdminId: string | null
  createdAt: string
}

export type AdminNotificationType =
  | 'PAYMENT_COMPLETED'
  | 'WALLET_TOPUP_COMPLETED'
  | 'TICKET_CREATED'
  | 'SYSTEM_ERROR_SPIKE'
  | 'LIARA_ERROR_RATE'

export interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  body: string
  metadata: Record<string, unknown> | null
  readBy: string[]
  createdAt: string
}

export interface AdminNotificationList {
  items: AdminNotification[]
  total: number
  page: number
  pageSize: number
}

// docs/PRD-user-push-notifications-and-mobile-app-flows.md بخش ۳ — پوش دلخواه ادمین به کاربران عادی
export type PushCampaignSegment =
  | 'ALL'
  | 'REGISTERED_ONLY'
  | 'ANONYMOUS_ONLY'
  | 'ACTIVE_SUBSCRIBERS'
  | 'BY_PLAN'
  | 'PHONE_LIST'

export interface PushCampaign {
  id: string
  title: string
  body: string
  segment: PushCampaignSegment
  phoneList: string[]
  planIds: string[]
  sentCount: number
  failedCount: number
  createdByAdminId: string
  createdAt: string
}

export interface PushCampaignList {
  items: PushCampaign[]
  total: number
  page: number
  pageSize: number
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

export type LiaraCallType = 'chat' | 'title' | 'summary' | 'routing'

export interface LiaraStatsBucket {
  total: number
  success: number
  fail: number
  // میانگین ترکیبی هر ۴ نوع تماس — برای مقایسه‌ی معنادار از avgLatencyMsByType استفاده کنید
  avgLatencyMs: number
  byType: Record<LiaraCallType, number>
  avgLatencyMsByType: Record<LiaraCallType, number>
}

export interface LiveStatsSummary {
  activeStreams: number
  today: LiaraStatsBucket
}

export interface LiveStatsTimeseriesPoint extends LiaraStatsBucket {
  bucket: string
}

export interface DailyPeakPoint {
  day: string
  peak: number
}

// ─── چت anonymous (بدون لاگین) — docs مربوط به کوتای رایگان کاربران ناشناس ─────

export interface AnonymousChatConfig {
  id: string
  enabled: boolean
  defaultModel: string
  reasoningEffort: string | null
  freeMessageLimit: number
  dailyMessageLimitAfterFree: number
  maxInputTokens: number
  maxOutputTokens: number
  signupBannerMessage: string
  limitedZoneMessage: string
  blockedMessage: string
  hintTitle: string
  hintSubtitle: string
  updatedAt: string
}

export interface AnonAnalyticsOverview {
  totalIdentities: number
  totalSessions: number
  totalMessages: number
  convertedSessions: number
  conversionRate: number
  avgMessagesPerSession: number
}

export interface AnonAnalyticsTimeseriesPoint {
  day: string
  sessions: number
  messages: number
}

export interface AnonSessionConversation {
  id: string
  title: string | null
  createdAt: string
  lastMessageAt: string
}

export interface AnonAnalyticsSessionRow {
  id: string
  clientToken: string
  createdAt: string
  lastSeenAt: string
  migratedToUserId: string | null
  migratedAt: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  referrer: string | null
  landingPath: string | null
  identity: { ip: string; lifetimeMessageCount: number }
  conversations: AnonSessionConversation[]
}

export interface AnonAnalyticsSessionsResult {
  rows: AnonAnalyticsSessionRow[]
  total: number
  page: number
  pageSize: number
}

export interface AnonSessionMessage {
  id: string
  conversationId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  tokensInput: number
  tokensOutput: number
  model: string | null
  createdAt: string
}

export interface AnonFunnelStage {
  key: string
  label: string
  count: number
  dropOffPct: number
}

export interface AnonAnalyticsCampaignRow {
  utmSource: string | null
  utmCampaign: string | null
  sessions: number
  messages: number
  signups: number
  purchases: number
  revenue: number
  conversionRate: number
}

export interface AnonConversionQualityBucket {
  bucket: string
  count: number
}

export interface AnonConversionQuality {
  sampleSize: number
  avgMessagesBeforePurchase: number
  avgDaysToPurchase: number
  avgRevenueToman: number
  histogram: AnonConversionQualityBucket[]
}

export interface AnonConversionPathSegment {
  key: string
  label: string
  description: string
  sessionCount: number
  stages: AnonFunnelStage[]
}
