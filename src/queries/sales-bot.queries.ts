import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  LeadFollowUpStatus,
  LeadProfileList,
  SalesBotAnalyticsOverview,
  SalesBotAnalyticsPoint,
  SalesBotConfig,
} from '@/types/api'
import { keys } from './keys'

export function useSalesBotConfig() {
  return useQuery({
    queryKey: keys.salesBot.config(),
    queryFn: () => api.get<SalesBotConfig>('/admin/sales-bot/config').then((r) => r.data),
  })
}

export function useUpdateSalesBotConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<SalesBotConfig, 'id' | 'updatedAt'>>) =>
      api.patch<SalesBotConfig>('/admin/sales-bot/config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.salesBot.config() }),
  })
}

export function useSalesBotAnalyticsOverview(from: string, to: string) {
  return useQuery({
    queryKey: keys.salesBot.overview(from, to),
    queryFn: () =>
      api
        .get<SalesBotAnalyticsOverview>('/admin/sales-bot/analytics/overview', { params: { from, to } })
        .then((r) => r.data),
  })
}

export function useSalesBotAnalyticsTimeseries(from: string, to: string) {
  return useQuery({
    queryKey: keys.salesBot.timeseries(from, to),
    queryFn: () =>
      api
        .get<SalesBotAnalyticsPoint[]>('/admin/sales-bot/analytics/timeseries', { params: { from, to } })
        .then((r) => r.data),
  })
}

export function useSalesBotLeads(page: number, status?: string) {
  return useQuery({
    queryKey: keys.salesBot.leads(page, status),
    queryFn: () =>
      api
        .get<LeadProfileList>('/admin/sales-bot/leads', { params: { page, limit: 20, status } })
        .then((r) => r.data),
  })
}

export function useUpdateLeadFollowUp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, followUpStatus }: { id: string; followUpStatus: LeadFollowUpStatus }) =>
      api.patch(`/admin/sales-bot/leads/${id}`, { followUpStatus }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'leads'] }),
  })
}

export function useSendLeadSms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post(`/admin/sales-bot/leads/${id}/sms`, { message }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'leads'] }),
  })
}
