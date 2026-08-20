import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreditsReport } from '@/types/api'
import { keys } from './keys'

// docs/PRD-admin-credit-reports.md فاز ۱ — نیوو فروخته/مصرف‌شده/margin
export function useCreditsReport(from?: string, to?: string) {
  return useQuery({
    queryKey: keys.creditsReport.report(from, to),
    queryFn: () =>
      api
        .get<CreditsReport>('/admin/creative/credits-report', { params: { from, to } })
        .then((r) => r.data),
  })
}
