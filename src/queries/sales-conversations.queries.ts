import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedSalesConversations } from '@/types/api'
import { keys } from './keys'

interface SalesConversationsParams {
  page: number
  storeId?: string
  state?: string
  from?: string
  to?: string
}

// فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — برخلاف useFailedMessages (فقط پیام‌های نافهم)، این لیست عمومی و
// قابل‌مرور همه‌ی مکالمات است (GET /admin/sales-agent/conversations)
export function useSalesConversations(params: SalesConversationsParams) {
  const { page, storeId, state, from, to } = params
  return useQuery({
    queryKey: keys.salesConversations.list(page, storeId, state, from, to),
    queryFn: () =>
      api
        .get<PaginatedSalesConversations>('/admin/sales-agent/conversations', {
          params: { page, storeId, state, from, to },
        })
        .then((r) => r.data),
  })
}
