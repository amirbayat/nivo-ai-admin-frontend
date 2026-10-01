export const keys = {
  auth: { me: () => ['auth', 'me'] as const },
  dashboard: { stats: () => ['admin', 'dashboard'] as const },
  users: {
    list: (page: number, search: string) => ['admin', 'users', page, search] as const,
    detail: (id: string) => ['admin', 'users', id] as const,
  },
  plans: { list: () => ['admin', 'plans'] as const },
  planRouting: { detail: (planId: string) => ['admin', 'plans', planId, 'routing'] as const },
  payments: { list: (page: number) => ['admin', 'payments', page] as const },
  feedback: {
    list: (page: number) => ['admin', 'feedback', page] as const,
    summary: () => ['admin', 'feedback', 'summary'] as const,
  },
  tokenStats: { data: () => ['admin', 'token-stats'] as const },
  tickets: {
    list: (status?: string) => ['admin', 'tickets', status ?? 'all'] as const,
    detail: (id: string) => ['admin', 'tickets', id] as const,
  },
  models: { list: () => ['admin', 'models'] as const },
  creativePrompts: {
    list: (sourceType?: string) => ['admin', 'creative-prompts', sourceType ?? 'all'] as const,
    pendingSubmissions: () => ['admin', 'creative-prompts', 'pending-submissions'] as const,
    pendingSubmissionsCount: () => ['admin', 'creative-prompts', 'pending-submissions-count'] as const,
  },
  creativeCategories: { list: () => ['admin', 'creative-categories'] as const },
  creditConfig: {
    config: () => ['admin', 'credit-config'] as const,
    packages: () => ['admin', 'credit-packages'] as const,
  },
  pricingTiers: { all: () => ['admin', 'pricing-tiers'] as const },
  captionPricingTiers: { all: () => ['admin', 'caption-pricing-tiers'] as const },
  creditsReport: {
    report: (from?: string, to?: string) => ['admin', 'credits-report', from ?? '', to ?? ''] as const,
  },
  modelFeedback: {
    list: (page: number, model?: string, vote?: string) =>
      ['admin', 'model-feedback', page, model ?? 'all', vote ?? 'all'] as const,
    summary: () => ['admin', 'model-feedback', 'summary'] as const,
  },
  comments: {
    list: (page: number, status?: string, storeId?: string) =>
      ['admin', 'comments', page, status ?? 'all', storeId ?? 'all'] as const,
  },
  analytics: {
    overview: (from: string, to: string, compare: boolean) =>
      ['admin', 'analytics', 'overview', from, to, compare] as const,
    timeseries: (from: string, to: string, granularity: string) =>
      ['admin', 'analytics', 'timeseries', from, to, granularity] as const,
    models: (from: string, to: string) => ['admin', 'analytics', 'models', from, to] as const,
    topics: (from: string, to: string) => ['admin', 'analytics', 'topics', from, to] as const,
    limitHits: (from: string, to: string) => ['admin', 'analytics', 'limit-hits', from, to] as const,
    users: (from: string, to: string, segment?: string) =>
      ['admin', 'analytics', 'users', from, to, segment ?? 'all'] as const,
    userModels: (userId: string, from: string, to: string) =>
      ['admin', 'analytics', 'users', userId, 'models', from, to] as const,
    segments: () => ['admin', 'analytics', 'segments'] as const,
    segmentBreakdown: (from: string, to: string) =>
      ['admin', 'analytics', 'segments', 'breakdown', from, to] as const,
    topicsList: () => ['admin', 'topics'] as const,
    liaraProvisioningIssues: () => ['admin', 'liara', 'provisioning-issues'] as const,
  },
  campaigns: {
    list: () => ['admin', 'campaigns'] as const,
    waitlist: (campaignId: string, status?: string) =>
      ['admin', 'campaigns', campaignId, 'waitlist', status ?? 'all'] as const,
  },
  salesAgentQuality: {
    abStats: (groupBy: 'variant' | 'channel' | 'voiceVariant', storeId?: string, from?: string, to?: string) =>
      ['admin', 'sales-agent-quality', 'ab-stats', groupBy, storeId ?? 'all', from ?? '', to ?? ''] as const,
    failedMessages: (
      page: number,
      storeId?: string,
      variant?: string,
      reason?: string,
      from?: string,
      to?: string,
    ) =>
      [
        'admin',
        'sales-agent-quality',
        'failed-messages',
        page,
        storeId ?? 'all',
        variant ?? 'all',
        reason ?? 'all',
        from ?? '',
        to ?? '',
      ] as const,
    trace: (conversationId: string) =>
      ['admin', 'sales-agent-quality', 'trace', conversationId] as const,
    // docs/PRD-product-strategy-and-roadmap.md بخش ۵.۱۰ بند ۳
    followUpInstrumentation: (storeId?: string, from?: string, to?: string) =>
      ['admin', 'sales-agent-quality', 'followup-instrumentation', storeId ?? 'all', from ?? '', to ?? ''] as const,
    cartRecoveryInstrumentation: (storeId?: string, from?: string, to?: string) =>
      ['admin', 'sales-agent-quality', 'cart-recovery-instrumentation', storeId ?? 'all', from ?? '', to ?? ''] as const,
    adPlacementInstrumentation: (storeId?: string) =>
      ['admin', 'sales-agent-quality', 'ad-placement-instrumentation', storeId ?? 'all'] as const,
  },
  // فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — لیست عمومی و قابل‌مرور همه‌ی مکالمات، جدا از salesAgentQuality
  // (که فقط failed-messages را لیست می‌کند)
  salesConversations: {
    list: (page: number, storeId?: string, state?: string, from?: string, to?: string) =>
      ['admin', 'sales-conversations', page, storeId ?? 'all', state ?? 'all', from ?? '', to ?? ''] as const,
  },
  // docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵
  buyerIntentDiscovery: {
    report: (storeId?: string, from?: string, to?: string) =>
      ['admin', 'buyer-intent-discovery', storeId ?? 'all', from ?? '', to ?? ''] as const,
  },
  // docs/PRD-product-strategy-and-roadmap.md بخش ۵.۵ — ست سؤال‌های طلایی، جدا از آمار A/B واقعی بالا
  salesAgentQa: {
    stores: () => ['admin', 'sales-agent-qa', 'stores'] as const,
  },
  salesBot: {
    config: () => ['admin', 'sales-bot', 'config'] as const,
    overview: (from: string, to: string) => ['admin', 'sales-bot', 'analytics', 'overview', from, to] as const,
    timeseries: (from: string, to: string) => ['admin', 'sales-bot', 'analytics', 'timeseries', from, to] as const,
    leads: (page: number, status?: string) => ['admin', 'sales-bot', 'leads', page, status ?? 'all'] as const,
    kb: (kind?: string) => ['admin', 'sales-bot', 'kb', kind ?? 'all'] as const,
    sessions: (page: number) => ['admin', 'sales-bot', 'sessions', page] as const,
  },
  articles: {
    list: () => ['admin', 'articles'] as const,
    categories: () => ['admin', 'article-categories'] as const,
  },
  chatConfig: {
    detail: () => ['admin', 'chat-config'] as const,
  },
  videoEditConfig: {
    detail: () => ['admin', 'video-edit-config'] as const,
  },
  kieVideoModels: {
    list: () => ['admin', 'kie-video-models'] as const,
  },
  growth: {
    config: () => ['admin', 'growth', 'config'] as const,
    onboardingGift: () => ['admin', 'growth', 'onboarding-gift'] as const,
    discountCodes: (source?: string) => ['admin', 'growth', 'discount-codes', source ?? 'all'] as const,
  },
  contentAgentApiKeys: {
    list: () => ['admin', 'content-agent', 'api-keys'] as const,
  },
  otp: {
    list: () => ['admin', 'otp'] as const,
  },
  liveStats: {
    summary: () => ['admin', 'live-stats', 'summary'] as const,
    timeseries: (minutes: number) => ['admin', 'live-stats', 'timeseries', minutes] as const,
    dailyPeaks: (days: number) => ['admin', 'live-stats', 'daily-peaks', days] as const,
  },
  networkOutage: {
    current: () => ['admin', 'network-outage', 'current'] as const,
    history: (limit: number) => ['admin', 'network-outage', 'history', limit] as const,
  },
  adminNotifications: {
    list: (page: number) => ['admin', 'notifications', page] as const,
    unreadCount: () => ['admin', 'notifications', 'unread-count'] as const,
  },
  pushNotifications: {
    list: (page: number) => ['admin', 'push-notifications', page] as const,
  },
  anonChatConfig: {
    detail: () => ['admin', 'anon-chat-config'] as const,
  },
  anonAnalytics: {
    overview: (from: string, to: string) => ['admin', 'anon-analytics', 'overview', from, to] as const,
    timeseries: (from: string, to: string) => ['admin', 'anon-analytics', 'timeseries', from, to] as const,
    sessions: (from: string, to: string, page: number, pageSize: number, utmSource?: string, utmCampaign?: string) =>
      ['admin', 'anon-analytics', 'sessions', from, to, page, pageSize, utmSource ?? 'all', utmCampaign ?? 'all'] as const,
    funnel: (from: string, to: string, utmSource?: string, utmCampaign?: string) =>
      ['admin', 'anon-analytics', 'funnel', from, to, utmSource ?? 'all', utmCampaign ?? 'all'] as const,
    conversionPaths: (from: string, to: string, utmSource?: string, utmCampaign?: string) =>
      ['admin', 'anon-analytics', 'conversion-paths', from, to, utmSource ?? 'all', utmCampaign ?? 'all'] as const,
    campaigns: (from: string, to: string) => ['admin', 'anon-analytics', 'campaigns', from, to] as const,
    conversionQuality: (from: string, to: string) => ['admin', 'anon-analytics', 'conversion-quality', from, to] as const,
  },
  behavior: {
    overview: (from: string, to: string) => ['events', 'overview', from, to] as const,
    journey: (actorId: string) => ['events', 'journey', actorId] as const,
    topNextEvents: (after: string, from: string, to: string) =>
      ['events', 'top-next-events', after, from, to] as const,
    explorer: (page: number, eventName?: string, userId?: string) =>
      ['events', 'explorer', page, eventName ?? 'all', userId ?? 'all'] as const,
    dimensionValues: (key: string, from: string, to: string) =>
      ['events', 'dimension-values', key, from, to] as const,
    savedFunnels: () => ['events', 'saved-funnels'] as const,
    eventProperties: (eventName: string, from: string, to: string) =>
      ['events', 'event-properties', eventName, from, to] as const,
  },
} as const
