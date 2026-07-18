import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminNotificationList } from '@/types/api'
import { keys } from './keys'

// docs/PRD-admin-notifications-and-mobile.md بخش ۲ — بدون WebSocket، مثل بقیه‌ی صفحات «زنده»ی
// پنل (network-outage, live-stats) با polling ساده
const POLL_INTERVAL_MS = 15_000

export function useAdminNotifications(page = 1) {
  return useQuery({
    queryKey: keys.adminNotifications.list(page),
    queryFn: () =>
      api.get<AdminNotificationList>('/admin/notifications', { params: { page } }).then((r) => r.data),
    refetchInterval: POLL_INTERVAL_MS,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: keys.adminNotifications.unreadCount(),
    queryFn: () => api.get<number>('/admin/notifications/unread-count').then((r) => r.data),
    refetchInterval: POLL_INTERVAL_MS,
  })
}

function useInvalidateNotifications() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'notifications'] })
  }
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/notifications/${id}/read`).then((r) => r.data),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: () => api.post('/admin/notifications/read-all').then((r) => r.data),
    onSuccess: invalidate,
  })
}
