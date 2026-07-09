export const keys = {
  auth: { me: () => ['auth', 'me'] as const },
  dashboard: { stats: () => ['admin', 'dashboard'] as const },
  users: { list: (page: number, search: string) => ['admin', 'users', page, search] as const },
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
  modelFeedback: {
    list: (page: number, model?: string, vote?: string) =>
      ['admin', 'model-feedback', page, model ?? 'all', vote ?? 'all'] as const,
    summary: () => ['admin', 'model-feedback', 'summary'] as const,
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
  },
  campaigns: {
    list: () => ['admin', 'campaigns'] as const,
    waitlist: (campaignId: string, status?: string) =>
      ['admin', 'campaigns', campaignId, 'waitlist', status ?? 'all'] as const,
  },
} as const
