import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  BulkImportSalesKbResult,
  LeadFollowUpStatus,
  LeadProfileList,
  SalesBotAnalyticsOverview,
  SalesBotAnalyticsPoint,
  SalesBotConfig,
  SalesKbEntry,
  SalesKbEntryInput,
  SalesKbRetrievalDebugResult,
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

// ─── پایگاه دانش (RAG) — docs/PRD-sales-kb-rag-and-plan-context.md بخش الف ─────────────

export function useSalesKbEntries(kind?: string) {
  return useQuery({
    queryKey: keys.salesBot.kb(kind),
    queryFn: () =>
      api.get<SalesKbEntry[]>('/admin/sales-bot/kb', { params: kind ? { kind } : {} }).then((r) => r.data),
  })
}

export function useCreateSalesKbEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SalesKbEntryInput) =>
      api.post<SalesKbEntry>('/admin/sales-bot/kb', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'kb'] }),
  })
}

export function useUpdateSalesKbEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SalesKbEntryInput> }) =>
      api.patch<SalesKbEntry>(`/admin/sales-bot/kb/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'kb'] }),
  })
}

export function useDeleteSalesKbEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sales-bot/kb/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'kb'] }),
  })
}

export function useBulkImportSalesKb() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entries: SalesKbEntryInput[]) =>
      api.post<BulkImportSalesKbResult>('/admin/sales-bot/kb/bulk-import', { entries }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'sales-bot', 'kb'] }),
  })
}

export function useTestSalesKbRetrieval() {
  return useMutation({
    mutationFn: (sampleMessage: string) =>
      api
        .post<SalesKbRetrievalDebugResult[]>('/admin/sales-bot/kb/test-retrieval', { sampleMessage })
        .then((r) => r.data),
  })
}
