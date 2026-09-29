import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AbModelStat, PaginatedFailedMessages } from '@/types/api'
import { keys } from './keys'

export function useAbStats() {
  return useQuery({
    queryKey: keys.salesAgentQuality.abStats(),
    queryFn: () =>
      api.get<AbModelStat[]>('/admin/sales-agent/ab-stats').then((r) => r.data),
  })
}

interface FailedMessagesParams {
  page: number
  storeId?: string
  variant?: string
  reason?: 'UNCLEAR' | 'NO_KB_MATCH'
  from?: string
  to?: string
}

export function useFailedMessages(params: FailedMessagesParams) {
  const { page, storeId, variant, reason, from, to } = params
  return useQuery({
    queryKey: keys.salesAgentQuality.failedMessages(page, storeId, variant, reason, from, to),
    queryFn: () =>
      api
        .get<PaginatedFailedMessages>('/admin/sales-agent/failed-messages', {
          params: { page, storeId, variant, reason, from, to },
        })
        .then((r) => r.data),
  })
}
