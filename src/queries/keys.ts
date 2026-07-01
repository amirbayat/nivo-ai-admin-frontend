export const keys = {
  auth: { me: () => ['auth', 'me'] as const },
  dashboard: { stats: () => ['admin', 'dashboard'] as const },
  users: { list: (page: number, search: string) => ['admin', 'users', page, search] as const },
  plans: { list: () => ['admin', 'plans'] as const },
  payments: { list: (page: number) => ['admin', 'payments', page] as const },
  feedback: {
    list: (page: number) => ['admin', 'feedback', page] as const,
    summary: () => ['admin', 'feedback', 'summary'] as const,
  },
  tokenStats: { data: () => ['admin', 'token-stats'] as const },
} as const
