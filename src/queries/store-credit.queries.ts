import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedCreditUsageEvents, PaginatedStoreCreditOverview } from '@/types/api'
import { keys } from './keys'

// docs/PRD-admin-seller-credit-overview.md بخش ۲ — لیست فروشنده‌ها با رول‌آپ اعتبار/هزینه‌ی AI
export function useStoreCreditOverview(params: { page: number; search?: string; from?: string; to?: string }) {
  const { page, search, from, to } = params
  return useQuery({
    queryKey: keys.storeCredit.list(page, search, from, to),
    queryFn: () =>
      api
        .get<PaginatedStoreCreditOverview>('/admin/stores', { params: { page, search, from, to } })
        .then((r) => r.data),
  })
}

// docs/PRD-admin-seller-credit-overview.md بخش ۳ — جزئیات خام مصرف یک فروشگاه
export function useStoreCreditUsage(params: {
  storeId: string | null
  page: number
  kind?: string
  from?: string
  to?: string
}) {
  const { storeId, page, kind, from, to } = params
  return useQuery({
    queryKey: keys.storeCredit.usage(storeId ?? '', page, kind, from, to),
    enabled: !!storeId,
    queryFn: () =>
      api
        .get<PaginatedCreditUsageEvents>(`/admin/stores/${storeId}/credit-usage`, {
          params: { page, kind, from, to },
        })
        .then((r) => r.data),
  })
}
