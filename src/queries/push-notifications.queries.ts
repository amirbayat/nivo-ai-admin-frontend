import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PushCampaign, PushCampaignList, PushCampaignSegment } from '@/types/api'
import { keys } from './keys'

// docs/PRD-user-push-notifications-and-mobile-app-flows.md بخش ۶ — بدون polling، چون این صفحه
// یک فرم ارسال یک‌باره + تاریخچه است، نه یک feed زنده مثل admin-notifications
export function usePushCampaigns(page = 1) {
  return useQuery({
    queryKey: keys.pushNotifications.list(page),
    queryFn: () => api.get<PushCampaignList>('/admin/push-notifications', { params: { page } }).then((r) => r.data),
  })
}

export interface SendPushNotificationInput {
  title: string
  body: string
  segment: PushCampaignSegment
  phoneList?: string[]
}

export function useSendPushNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SendPushNotificationInput) =>
      api.post<PushCampaign>('/admin/push-notifications', input).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'push-notifications'] })
    },
  })
}
