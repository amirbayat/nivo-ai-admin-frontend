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
  // این دسته‌بندی مبتنی بر priceMonthly/expectedByNow است — فقط برای کاربر با پلن ماهانه‌ی
  // پولی/PAYG معنادار است؛ برای کاربر فقط‌نیوویی از creditConsumed* زیر استفاده کنید
  // (docs/PRD-admin-credit-reports.md فاز ۴)
  category: 'heavy' | 'moderate' | 'light' | 'inactive'
  creditConsumedTomanThisMonth: number
  creditConsumedCreditsThisMonth: number
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: 'CREDIT' | 'DEBIT'
  amountToman: number
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  // فقط برای تراکنش‌های DEBIT ناشی از پیام چت (metadata.messageId) پر می‌شود — بقیه‌ی
  // تراکنش‌ها (شارژ، بازگشت وجه، دیسکاوری/کریتیو) پیوند پیامی ندارند
  message: {
    model: string | null
    costToman: number
    costUsdMicros: number
    openrouterRealCostUsdMicros: number | null
    openrouterRealCostToman: number | null
  } | null
}

export interface UserDetailPayment {
  id: string
  kind: 'SUBSCRIPTION' | 'WALLET_TOPUP'
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  provider: string
  createdAt: string
  plan: { name: string } | null
  // فقط برای kind=WALLET_TOPUP که از خرید بسته‌ی نیوو آمده — null یعنی شارژ دستی PAYG قدیمی
  // (docs/PRD-admin-credit-reports.md بخش ۲)
  packageId: string | null
  credits: number | null
}

export interface UserCreativeGeneration {
  id: string
  promptId: string
  projectId: string | null
  outputType: 'IMAGE' | 'TEXT'
  creditCost: number
  costToman: number
  model: string | null
  status: 'SUCCEEDED' | 'FAILED'
  failureReason: string | null
  createdAt: string
  prompt: { title: string; outputType: 'IMAGE' | 'TEXT' }
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

export interface UserDetailMessage {
  id: string
  createdAt: string
  model: string | null
  costToman: number
  costUsdMicros: number
  // فقط وقتی provider=OPENROUTER بوده پر می‌شود؛ null یعنی روی لیارا بوده
  openrouterRealCostUsdMicros: number | null
  openrouterRealCostToman: number | null
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
  creativeGenerations: UserCreativeGeneration[]
  messages: UserDetailMessage[]
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
  // بعد از قطع کامل پلن ماهانه (docs/PRD-discovery-and-credits.md بخش ۲.۲)، mrr دیگر
  // «اشتراک ماهانه» را نمایندگی نمی‌کند — creditRevenueToman زیر معیار معنادار جایگزین است
  mrr: number
  creditRevenueToman: number
  totalConversations: number
  todayConversations: number
  exchangeRate: ExchangeRateInfo
  // docs/EXECUTION-PLAN.md قدم ۷ — provider فعلی AI (env AI_PROVIDER)، برای نشانگر ادمین
  aiProvider: 'liara' | 'openrouter'
}

export interface CostChartPoint {
  date: string
  aiCostToman: number // چت + دیسکاوری/کریتیو
  chatAiCostToman: number
  discoveryAiCostToman: number
  aiCostUsd: number
  revenueToman: number
  // null یعنی هنوز کلید اختصاصی لیارا برای کاربری در آن روز فعال نبوده — نه هزینه‌ی صفر
  liaraCostToman: number | null
  // معادل بالا برای OpenRouter — null یعنی آن روز پیام OpenRouter با cost واقعی نداشتیم
  openrouterCostToman: number | null
}

export interface PricingAlert {
  monthlyRevenueToman: number
  monthlyAiCostToman: number // چت + دیسکاوری/کریتیو
  monthlyChatAiCostToman: number
  monthlyDiscoveryAiCostToman: number
  monthlyAiCostUsd: number
  aiCostRatio: number
  alertLevel: 'safe' | 'warning' | 'critical'
  suggestion: string | null
}

// docs/PRD-admin-credit-reports.md فاز ۱ — GET /admin/creative/credits-report
export interface CreditsReportPackageRow {
  packageId: string
  isCustomAmount: boolean
  transactions: number
  credits: number
  toman: number
}

export interface CreditsReportPromptRow {
  promptId: string
  title: string
  generations: number
  creditCost: number
  costToman: number
}

export interface CreditsReport {
  range: { from: string; to: string }
  sold: {
    totalTransactions: number
    totalCredits: number
    totalToman: number
    byPackage: CreditsReportPackageRow[]
  }
  consumed: {
    totalGenerations: number
    totalCreditCost: number
    totalCostToman: number
    byPrompt: CreditsReportPromptRow[]
  }
  outstanding: { balanceToman: number; credits: number }
  margin: { revenueToman: number; costToman: number; marginToman: number }
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

export interface ContentAgentApiKey {
  id: string
  label: string
  isActive: boolean
  lastUsedAt: string | null
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
  projectContextMaxChars: number
  maxImagesPerMessage: number
  maxImageSizeMb: number
  allowedImageFormats: string[]
  implicitImageGenEnabled: boolean
  updatedAt: string
}

// docs/PRD-video-edit-omni-kie.md — «ویرایش ویدیو» با Kie.ai
export interface VideoEditConfig {
  id: string
  isEnabled: boolean
  generateFixedDurationSec: number
  maxConcurrentJobsPerUser: number
  maxJobsPerDayPerUser: number | null
  updatedAt: string
}

export type KieVideoCategory =
  | 'GENERATE'
  | 'EDIT'
  | 'UPSCALE'
  | 'LIPSYNC'
  | 'DUBBING'
  | 'MOTION_TRANSFER'
  | 'EXTEND'
  | 'OTHER'

export type VideoModelProvider = 'KIE' | 'OPENROUTER' | 'VEO' | 'RUNWAY'
export type KieInputSchema = 'OMNI' | 'SEEDANCE' | 'WAN_V2V' | 'WAN_R2V' | 'WAN_VIDEO_EDIT'

export interface KieVideoModel {
  id: string
  provider: VideoModelProvider
  slug: string
  displayName: string
  category: KieVideoCategory
  isActive: boolean
  sortOrder: number
  supportsImages: boolean
  maxImages: number | null
  supportsVideo: boolean
  maxVideoDurationSec: number | null
  maxVideoWindowSec: number | null
  supportsAspectRatio: boolean
  supportsDuration: boolean
  resolutions: string[]
  pricePerSecondUsdConfirmed: number | null
  pricingNote: string | null
  kieInputSchema: KieInputSchema
  supportsScenePreservingEdit: boolean
  fixedDurations: number[]
  // معماری data-driven — null یعنی این مدل هنوز معماری قدیمی enum-dispatch است؛ شکل دقیق در
  // src/types/inputFields.ts (آینه‌ی دستی nivo-ai-backend/.../input-fields.schema.ts)
  inputFields: unknown | null
  createdAt: string
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

export type AiModelType = 'CHAT' | 'EMBEDDING' | 'IMAGE_GEN' | 'VIDEO_GEN'
// docs/PRD-openrouter-migration.md §۶.۳ — کدام پلتفرم(های) inference این name را می‌شناسد
export type AiPlatform = 'LIARA' | 'OPENROUTER'

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
  supportsWebSearch: boolean
  supportsFileInput: boolean
  supportsVideoInput: boolean
  supportsAudioInput: boolean
  imageGenInputImagePricePerM: number | null
  imageGenOutputImagePricePerM: number | null
  imageGenQuality: string | null
  imageGenSize: string | null
  // برای مدل‌های flat-priced (Recraft/Flux/Seedream/...) — قیمت ثابت هر عکس/مگاپیکسل، جایگزین
  // imageGenOutputImagePricePerM وقتی مدل اصلاً per-token قیمت‌گذاری نمی‌شود
  imageGenFlatPriceUsd: number | null
  imageGenFlatPriceUnit: 'image' | 'megapixel' | null
  // docs/PRD-image-gen-pricing-and-credit-fix.md بخش A — true یعنی این مدل باید از OpenRouter
  // POST /images (نه /chat/completions) فراخوانی شود
  imageGenUseDirectApi: boolean
  // true یعنی این مدل بدون عکس ورودی کار نمی‌کند (مثل recraft-v4-styles-pro) — «تولید از صفر»
  // برایش رد می‌شود با یک خطای فارسی روشن
  imageGenRequiresInputImage: boolean
  // Job-written provider USD per image. Catalog converts to credits at read time.
  // Not admin-editable.
  estimatedImageGenCostUsd: number | null
  // Derived at catalog read (not stored). Kept on the admin GET payload for now.
  estimatedImageGenCreditCost: number | null
  // docs/PRD-video-studio-chat-flow.md — فقط برای modelType==='VIDEO_GEN'
  videoGenPricePerSecondUsd: number | null
  videoGenAudioMultiplier: number | null
  videoGenSupportedDurationsSec: number[]
  videoGenSupportedSizes: string[]
  isActive: boolean
  sortOrder: number
  tier: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'
  createdAt: string
  // docs/PRD-openrouter-migration.md §۱۳.۴/۱۴.۴ — صفحه‌ی انتخاب مدل بازطراحی‌شده (فرانت مصرف‌کننده)
  description: string | null
  badges: string[]
  platform: AiPlatform[]
}

// docs/PRD-discovery-and-credits.md — «نیوو» یعنی واحد نمایشی روی همان Wallet موجود
export interface CreditConfig {
  id: string
  tomanPerCredit: number
  purchaseMarkup: number
  roundingSteps: number[]
  freeSignupCredits: number
  extractionEconomicalModel: string | null
  extractionEconomicalCreditCost: number
  extractionPremiumModel: string | null
  extractionPremiumCreditCost: number
  sourceImageAccuracyCreditCost: number
  updatedAt: string
}

// docs/PRD-sales-agent-checkout-pricing-and-roadmap.md بخش ۶.۵ — جدا از CreditConfig بالا
// (که مال ویجت نیوو/nivoai.ir است)؛ سهمیه‌ی رایگان روزانه + دوره‌ی آزمایشی مارکت‌پلیس
export interface SalesAgentGlobalConfig {
  id: string
  freeDailyQuota: number
  trialDurationDays: number
  trialCreditToman: number
  // فیدبک کاربر ۱۴۰۵/۰۷/۱۷ — ضریب روی COGS خام قبل از کسر از اعتبار فروشگاه
  buyerCostMarkup: number
  sellerCostMarkup: number
  // فقط برای برآورد نمایشی «حدود N چت» روی کارت‌های خرید اعتبار، نه کسر واقعی
  avgCostPerChatToman: number
  // null = pool تصادفی (پیش‌فرض)؛ غیر-null یکی از کلیدهای /admin/sales-agent/model-variants را فورس می‌کند
  forcedModelVariant: string | null
  updatedAt: string
}

export type CreditPackageScope = 'GENERAL' | 'NIVO_CAL' | 'NIVO_CAL_BAZAAR' | 'STORE_AI_CREDIT'

export interface CreditPackage {
  id: string
  credits: number
  discountPercent: number
  isPopular: boolean
  isBestValue: boolean
  isCustomAmount: boolean
  isActive: boolean
  sortOrder: number
  scope: CreditPackageScope
  bazaarSku: string | null
  // فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — فقط برای scope=STORE_AI_CREDIT: بسته‌ی مخصوص یک فروشگاه خاص
  storeId: string | null
  createdAt: string
}

export type PricingGenerationType = 'TEXT' | 'IMAGE' | 'VIDEO'

export interface PricingTier {
  id: string
  type: PricingGenerationType
  minToman: number
  maxToman: number | null
  markup: number
  createdAt: string
  updatedAt: string
}

// docs/PRD-video-auto-captions.md §۱۴.۳ — پله‌ی «تا X ثانیه Y نیوو»
export interface CaptionPricingTier {
  id: string
  maxDurationSec: number | null
  creditCost: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreativeCategory {
  id: string
  name: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export interface CreativePrompt {
  id: string
  title: string
  outputType: 'IMAGE' | 'TEXT'
  segment: 'GENERAL' | 'INSTAGRAM' | 'YOUTUBE' | 'BUSINESS'
  categoryId: string | null
  description: string | null
  contextMd: string
  userPromptTemplate: string
  exampleImageUrl: string | null
  aspectRatio: string | null
  requiresUserImage: boolean
  creditCost: number
  preferredModel: string | null
  isTrending: boolean
  isActive: boolean
  sortOrder: number
  tags: string[]
  createdAt: string
  updatedAt: string
  // ── پیشنهاد کاربر از طریق «تبدیل عکس به پرامپت» — روی ردیف‌های CURATED قدیمی هم
  // ممکن است نباشد (رکوردهای خیلی قدیمی)، پس اختیاری در نظر گرفته می‌شود
  sourceType?: 'CURATED' | 'USER_EXTRACTED'
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  sourceImageKey?: string | null
  submittedByUserId?: string | null
}

// ردیف USER_EXTRACTED که از GET /admin/creative/prompts?sourceType=USER_EXTRACTED&reviewStatus=PENDING
// می‌آید — همان CreativePrompt به‌علاوه‌ی هویت کاربر ارسال‌کننده
export interface CreativePromptSubmission extends CreativePrompt {
  sourceType: 'USER_EXTRACTED'
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: { phone: string; name: string | null } | null
}

// docs/PRD-customer-comments-and-discounts.md بخش الف/۵
export type ProductCommentStatus = 'PENDING' | 'AI_AUTO_REJECTED' | 'ADMIN_APPROVED' | 'ADMIN_REJECTED'

export interface ProductCommentItem {
  id: string
  storeId: string
  productId: string | null
  customerId: string
  text: string
  rating: number | null
  // docs/PRD-seller-demo-sandbox-hub-promo-and-release-prep.md بخش ۱۴.۲
  imageKey: string | null
  videoKey: string | null
  audioKey: string | null
  status: ProductCommentStatus
  aiVerdict: string | null
  aiConfidence: number | null
  moderatedAt: string | null
  createdAt: string
  store: { name: string }
  product: { name: string } | null
}

export interface PaginatedProductComments {
  items: ProductCommentItem[]
  total: number
  page: number
  limit: number
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

// ── Sales Agent Quality (A/B مدل‌ها + پیام‌های نافهم) ────────────────────────

// docs/PRD-sales-agent-admin-analytics.md بخش ۴ — group یعنی نام مدل (groupBy=variant) یا
// 'WEB'/'TELEGRAM' (groupBy=channel)، بسته به toggle فعلی صفحه
export interface AbModelStat {
  group: string
  conversations: number
  avgClarifyAttempts: number
  stuckHandoffRate: number
  approvedOrderRate: number
  aiCalls: number
  fallbackRate: number
  avgLatencyMs: number
}

// docs/PRD-product-strategy-and-roadmap.md بخش ۵.۵ — نتیجه‌ی یک سؤال طلایی؛ answer/error هرگز
// هم‌زمان پر نیستند
export interface GoldenQuestionResult {
  id: string
  category: string
  question: string
  answer?: string
  error?: string
  latencyMs: number
}

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵.۴
export interface IntentGoldenResult {
  id: string
  message: string
  expectedIntent: string
  actualIntent?: string
  intentConfidence?: string
  expectedBuyerNeeds?: string[]
  actualBuyerNeeds?: string[]
  unmatchedBuyerNeed?: string
  passed: boolean
  error?: string
  latencyMs: number
}

// docs/PRD-sales-agent-implicit-need-detection.md بخش ۵ (فاز ۰ + سیگنال‌های فاز ۱)
export interface ImplicitNeedGoldenResult {
  id: string
  category: string
  message: string
  storeContext?: string
  expectedIntent: string
  actualIntent?: string
  intentConfidence?: string
  expectedBuyerNeeds?: string[]
  actualBuyerNeeds?: string[]
  unmatchedBuyerNeed?: string
  expectedNeedType?: string
  actualNeedType?: string
  implicitNeedSummary?: string
  expectedStoreRelevance?: string
  actualStoreRelevance?: string
  expectedPitchReadiness?: string
  actualPitchReadiness?: string
  passed: boolean
  notFullyMeasurableYet?: boolean
  error?: string
  latencyMs: number
}

export interface FailedMessageItem {
  id: string
  conversationId: string
  storeName: string
  customerMessage: string
  variant: string | null
  // docs/PRD-seller-knowledge-base.md بخش ۴ — UNCLEAR (NLU نفهمید) در برابر NO_KB_MATCH
  // (فهمید، ولی باکس دانش فروشگاه جوابی نداشت)
  reason: 'UNCLEAR' | 'NO_KB_MATCH'
  endedInHandoff: boolean
  createdAt: string
}

export interface PaginatedFailedMessages {
  items: FailedMessageItem[]
  total: number
  page: number
}

// فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — برخلاف FailedMessageItem (فقط پیام‌های نافهم)، این یک ردیف از
// لیست عمومی و قابل‌مرور همه‌ی مکالمات است (GET /admin/sales-agent/conversations)
export interface SalesConversationListItem {
  id: string
  storeId: string
  storeName: string
  customerName: string | null
  customerPhone: string | null
  channel: 'WEB' | 'TELEGRAM'
  currentState: string
  abVariant: string | null
  // فیدبک کاربر ۱۴۰۵/۰۷/۱۷ — مبلغ واقعاً کسرشده از اعتبار فروشگاه (بعد از buyerCostMarkup)
  totalChargedToman: number
  lastMessagePreview: string
  lastMessageAt: string | null
  failedTurnCount: number
  endedInHandoff: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedSalesConversations {
  items: SalesConversationListItem[]
  total: number
  page: number
}

// docs/PRD-product-strategy-and-roadmap.md بخش ۵.۱۰ بند ۳
export interface FollowUpInstrumentation {
  sentCount: number
  respondedCount: number
  responseRate: number
  verdictCounts: { POSITIVE: number; NEGATIVE: number; UNRELATED: number }
}

export interface CartRecoveryInstrumentation {
  remindersSent: number
  recoveredCount: number
  recoveryRate: number
}

export interface AdPlacementInstrumentationItem {
  id: string
  storeId: string
  storeName: string
  placement: 'TELEGRAM_STORE_SEARCH' | 'MARKETPLACE_FEATURED'
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  startsAt: string
  endsAt: string
  impressionCount: number
}

export interface AdPlacementInstrumentation {
  items: AdPlacementInstrumentationItem[]
  totalImpressions: number
}

// docs/PRD-admin-seller-credit-overview.md — لیست فروشنده‌ها با اعتبار/هزینه‌ی AI
export type CreditUsageKind = 'TEXT_REPLY' | 'VOICE_TTS' | 'ASR' | 'TOPUP' | 'PRODUCT_ENRICHMENT' | 'AD_PLACEMENT'

export interface StoreCreditOverviewItem {
  storeId: string
  slug: string
  name: string
  status: 'ACTIVE' | 'SUSPENDED'
  seller: { phone: string; name: string | null }
  creditBalanceToman: number
  trialCreditRemainingToman: number
  totalPurchasedToman: number
  // هزینه‌ی واقعی AI (شامل سهمیه‌ی رایگان) در برابر مبلغی که واقعاً از اعتبار کم شده
  totalAiCostToman: number
  totalChargedToman: number
  costByKind: Partial<Record<Exclude<CreditUsageKind, 'TOPUP'>, number>>
  freeQuotaEventsCount: number
  paidEventsCount: number
  // docs/PRD-seller-demo-sandbox-hub-promo-and-release-prep.md بخش ۱۶ — فقط از پنل ادمین قابل‌تغییر
  leadCaptureOnly: boolean
}

export interface PaginatedStoreCreditOverview {
  items: StoreCreditOverviewItem[]
  total: number
  page: number
  pageSize: number
}

// docs/PRD-admin-seller-credit-overview.md — جمع کل روی همه‌ی فروشگاه‌ها (نه فقط صفحه‌ی فعلی)
export interface StoreCreditSummary {
  storeCount: number
  totalCreditBalanceToman: number
  totalTrialCreditRemainingToman: number
  totalPurchasedToman: number
  totalAiCostToman: number
  totalChargedToman: number
  freeQuotaEventsCount: number
  paidEventsCount: number
}

export interface CreditUsageEventItem {
  id: string
  customerId: string | null
  conversationId: string | null
  model: string
  kind: CreditUsageKind
  costToman: number
  // فیدبک کاربر ۱۴۰۵/۰۷/۱۷ — مبلغ واقعاً کسرشده از اعتبار (بعد از buyerCostMarkup/sellerCostMarkup)
  chargedToman: number
  isFreeQuota: boolean
  tokensInput: number
  tokensOutput: number
  costUsdMicros: number
  createdAt: string
}

export interface PaginatedCreditUsageEvents {
  items: CreditUsageEventItem[]
  total: number
  page: number
  pageSize: number
}

// docs/PRD-admin-ai-decision-trace-log.md — تایم‌لاین کامل یک مکالمه برای دیباگ ادمین
export interface AiTraceVoiceInfo {
  generated: boolean
  voiceName?: string
  toneVariant?: string
  reason?:
    | 'TOO_SHORT'
    | 'CONVERSATION_CAP'
    | 'VOICE_VARIANT_OFF'
    | 'CONSECUTIVE_CAP'
    | 'STORE_NO_CREDIT_CAP'
    | 'FAILED'
}

// docs/PRD-sales-agent-persuasion-principles.md بخش ۸
export type PersuasionTechnique =
  | 'COMMITMENT_CONSISTENCY'
  | 'SOCIAL_PROOF'
  | 'AUTHORITY'
  | 'LIKING'
  | 'RECIPROCITY'
  | 'SCARCITY'

export interface AiTraceInfo {
  intent: string
  handler: string
  factsOrPrompt: string
  model: string
  // از CreditUsageEvent، نه خودِ payload ذخیره‌شده — بک‌اند با تطبیق زمانی ردیف‌های TEXT_REPLY
  // همین مکالمه اضافه می‌کند؛ ممکن است نامشخص باشد (پاسخ‌های قانون‌محور هزینه‌ای ندارند).
  // بعد از buyerCostMarkup (فیدبک کاربر ۱۴۰۵/۰۷/۱۷) — مبلغ واقعاً کسرشده، نه COGS خام
  chargedToman?: number
  kbSource?: 'STORE_KB' | 'PRODUCT_DESCRIPTION' | 'STORE_PROFILE' | 'STUB'
  voice?: AiTraceVoiceInfo
  // docs/PRD-sales-agent-persuasion-principles.md بخش ۸ — فقط روی trace سطح
  // runFullAgentTurn پر می‌شود؛ خوداظهاری خودِ مدل
  persuasionTechniquesUsed?: PersuasionTechnique[]
  usedGeneralKnowledge?: boolean
  // docs/PRD-full-agent-engineering-review.md بخش ۵ — فقط روی trace سطح runFullAgentTurn پر
  // می‌شوند
  relevantProductIdsRaw?: string[]
  lastShownProducts?: { id: string; name: string }[]
  toolsCalled?: { name: string; args: unknown }[]
  initialCatalogProductIds?: string[]
  stepsUsed?: number
  mutationHappened?: boolean
  progressHappened?: boolean
  isFallbackAttempt?: boolean
  suspiciousPriceClaims?: number[]
}

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۴.۲ — لایه‌ی «نیاز خریدار»، مکمل و جدا از
// intent اجرایی (چندبرچسبی)
export interface ClassificationTraceInfo {
  intent: string
  handler: string
  buyerNeeds?: string[]
  unmatchedBuyerNeed?: string
  intentConfidence?: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ConversationTraceItem {
  id: string
  createdAt: string
  customerMessage?: string
  agentReply?: {
    text: string
    flag?: 'UNCLEAR' | 'NO_KB_MATCH'
    // فیدبک کاربر ۱۴۰۵/۰۷/۱۲ — برخلاف trace.voice (فقط روی پاسخ‌های AI-محور)، این همیشه هست
    voice?: { generated: boolean; reason?: AiTraceVoiceInfo['reason'] }
  }
  trace?: AiTraceInfo
  classificationTrace?: ClassificationTraceInfo
}

export interface ConversationTraceResponse {
  items: ConversationTraceItem[]
}

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵ — گزارش تجمیعی صفحه‌ی مستقل کشف intent
// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۴.۱ — یک taxonomy واحد با فیلد journey_stage
// روی هر رکورد، به‌جای چند taxonomy جدا
export interface BuyerNeedCount {
  tag: string
  count: number
  journeyStage: 'PRE_PURCHASE' | 'PAYMENT' | 'POST_PURCHASE'
}

export interface UnmatchedBuyerNeedItem {
  label: string
  count: number
  conversationId: string
  storeName: string
  sampleMessage: string
  lastSeenAt: string
  // docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵.۲ — intent اجرایی تک‌برچسبی که کنار همین
  // unmatchedBuyerNeed کلاسیفای شده بود
  nearestIntent: string
}

export interface LowConfidenceItem {
  conversationId: string
  storeName: string
  intent: string
  confidence: 'MEDIUM' | 'LOW'
  sampleMessage: string
  createdAt: string
}

export interface BuyerIntentDiscoveryResponse {
  buyerNeedCounts: BuyerNeedCount[]
  unmatched: UnmatchedBuyerNeedItem[]
  lowConfidence: LowConfidenceItem[]
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
  // معادل بالا برای OpenRouter — از Message.openrouterRealCostToman (per-request)
  openrouterRealCostToman: number
  openrouterRequestCount: number
  openrouterMatchPct: number | null
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
  // معادل بالا برای OpenRouter — null یعنی این کاربر پیام OpenRouter با cost واقعی نداشته
  openrouterRealCostToman: number | null
  openrouterRequestCount: number
  openrouterMatchPct: number | null
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
  signupBannerAfterMessages: number
  samplePrompts: string[]
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

// docs/PRD-admin-product-enrichment-review.md
export type ProductEnrichmentStatus =
  | 'PENDING_ADMIN_REVIEW'
  | 'PENDING_SELLER_REVIEW'
  | 'SELLER_APPROVED'
  | 'SELLER_REJECTED'
  | 'ADMIN_REJECTED'

export interface LowCompletenessProduct {
  id: string
  name: string
  storeId: string
  storeName: string
  completeness: { percent: number; missing: string[] }
  activeDraftStatus: ProductEnrichmentStatus | null
}

export interface PaginatedLowCompletenessProducts {
  items: LowCompletenessProduct[]
  total: number
  page: number
  limit: number
}

export interface ProductEnrichmentDraft {
  id: string
  productId: string
  status: ProductEnrichmentStatus
  source: 'ADMIN_RESOURCE' | 'WEB_SEARCH'
  adminResourceText: string | null
  suggestedDescription: string
  suggestedQuestions: string[]
  suggestedSpecs: { label: string; value: string }[] | null
  sourceNote: string | null
  createdAt: string
}
