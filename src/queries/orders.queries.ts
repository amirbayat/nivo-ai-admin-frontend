import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminOrderPaymentMethodStats, PaginatedAdminOrders } from '@/types/api'
import { keys } from './keys'

// docs/PRD-buyer-payment-method-card-or-snapppay-link.md بخش ۹.۲ — لیست سفارش‌های کراس-فروشگاه
export function useAdminOrders(params: {
  page: number
  storeId?: string
  paymentMethod?: string
  status?: string
  from?: string
  to?: string
}) {
  const { page, storeId, paymentMethod, status, from, to } = params
  return useQuery({
    queryKey: keys.orders.list(page, storeId, paymentMethod, status, from, to),
    queryFn: () =>
      api
        .get<PaginatedAdminOrders>('/admin/orders', { params: { page, storeId, paymentMethod, status, from, to } })
        .then((r) => r.data),
  })
}

// همان بخش ۹.۲ — گزارش تعداد/مجموع مبلغ به تفکیک روش پرداخت
export function useAdminOrderPaymentMethodStats(params: { from?: string; to?: string }) {
  const { from, to } = params
  return useQuery({
    queryKey: keys.orders.paymentMethodStats(from, to),
    queryFn: () =>
      api
        .get<AdminOrderPaymentMethodStats>('/admin/orders/payment-method-stats', { params: { from, to } })
        .then((r) => r.data),
  })
}
