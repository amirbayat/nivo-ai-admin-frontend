import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AdminUser,
  AdminTicket,
  AiModel,
  CostChartPoint,
  DashboardStats,
  ManualLimit,
  Plan,
  PlanRouting,
  PricingAlert,
  FeedbackItem,
  FeedbackSummary,
  ModelFeedbackItem,
  ModelFeedbackSummary,
  TokenStats,
} from '@/types/api'
import { keys } from './keys'

interface PaginatedUsers {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
}

interface PaginatedFeedback {
  items: FeedbackItem[]
  total: number
  page: number
  pageSize: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: keys.dashboard.stats(),
    queryFn: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
  })
}

export function useAdminUsers(page: number, search: string) {
  return useQuery({
    queryKey: keys.users.list(page, search),
    queryFn: () =>
      api
        .get<PaginatedUsers>('/admin/users', { params: { page, search } })
        .then((r) => r.data),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<AdminUser> }) =>
      api.patch<AdminUser>(`/admin/users/${userId}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function usePlans() {
  return useQuery({
    queryKey: keys.plans.list(),
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })
}

export function useCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Plan, 'id'>) =>
      api.post<Plan>('/plans', data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.plans.list() })
    },
  })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Plan, 'id'>> }) =>
      api.patch<Plan>(`/plans/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.plans.list() })
    },
  })
}

export function usePlanRouting(planId: string | undefined) {
  return useQuery({
    queryKey: keys.planRouting.detail(planId ?? ''),
    queryFn: () => api.get<PlanRouting>(`/admin/plans/${planId}/routing`).then((r) => r.data),
    enabled: !!planId,
  })
}

export function useUpdatePlanRouting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: PlanRouting }) =>
      api.put<{ message: string }>(`/admin/plans/${planId}/routing`, data).then((r) => r.data),
    onSuccess: (_, { planId }) => {
      void qc.invalidateQueries({ queryKey: keys.planRouting.detail(planId) })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.plans.list() })
    },
  })
}

export function useAdminPayments() {
  return useQuery({
    queryKey: keys.dashboard.stats(),
    queryFn: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
  })
}

export function useFeedback(page: number) {
  return useQuery({
    queryKey: keys.feedback.list(page),
    queryFn: () =>
      api
        .get<PaginatedFeedback>('/admin/feedback', { params: { page } })
        .then((r) => r.data),
  })
}

export function useFeedbackSummary() {
  return useQuery({
    queryKey: keys.feedback.summary(),
    queryFn: () => api.get<FeedbackSummary>('/admin/feedback/summary').then((r) => r.data),
  })
}

export function useTriggerSummary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/admin/feedback/summary/trigger').then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.feedback.summary() })
    },
  })
}

export function useTokenStats() {
  return useQuery({
    queryKey: keys.tokenStats.data(),
    queryFn: () => api.get<TokenStats>('/admin/token-stats').then((r) => r.data),
  })
}

export function useCostChart(days = 30) {
  return useQuery({
    queryKey: ['admin', 'cost-chart', days],
    queryFn: () => api.get<CostChartPoint[]>('/admin/cost-chart', { params: { days } }).then(r => r.data),
  })
}

export function usePricingAlert() {
  return useQuery({
    queryKey: ['admin', 'pricing-alert'],
    queryFn: () => api.get<PricingAlert>('/admin/pricing-alert').then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useSetUserLimit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, type, reason }: { userId: string; type: ManualLimit['type']; reason?: string }) =>
      api.post(`/admin/users/${userId}/limit`, { type, reason }).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useRemoveUserLimit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}/limit`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useChangeUserPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      api.patch(`/admin/users/${userId}/plan`, { planId }).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminTickets(status?: string) {
  return useQuery({
    queryKey: keys.tickets.list(status),
    queryFn: () =>
      api
        .get<{ tickets: AdminTicket[] }>('/admin/tickets', { params: status ? { status } : {} })
        .then((r) => r.data.tickets),
  })
}

export function useAdminTicketDetail(id: string) {
  return useQuery({
    queryKey: keys.tickets.detail(id),
    queryFn: () =>
      api.get<{ ticket: AdminTicket }>(`/admin/tickets/${id}`).then((r) => r.data.ticket),
    enabled: !!id,
  })
}

export function useAdminReplyTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body, adminNote }: { id: string; body: string; adminNote?: string }) =>
      api.post(`/admin/tickets/${id}/reply`, { body, adminNote }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: keys.tickets.detail(variables.id) })
    },
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      priority,
      adminNote,
    }: {
      id: string
      status?: string
      priority?: string
      adminNote?: string
    }) =>
      api.patch(`/admin/tickets/${id}/status`, { status, priority, adminNote }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: keys.tickets.detail(variables.id) })
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
    },
  })
}

// ── AI Models ────────────────────────────────────────────────────────────────

export function useModels() {
  return useQuery({
    queryKey: keys.models.list(),
    queryFn: () => api.get<AiModel[]>('/admin/models').then((r) => r.data),
  })
}

export function useCreateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<AiModel, 'id' | 'createdAt'>) =>
      api.post<AiModel>('/admin/models', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.models.list() }),
  })
}

export function useUpdateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<AiModel, 'id' | 'createdAt'>> }) =>
      api.patch<AiModel>(`/admin/models/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.models.list() }),
  })
}

export function useDeleteModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/models/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.models.list() }),
  })
}

export interface ModelImportResult {
  total: number
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

export function useImportModels() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api
        .post<ModelImportResult>('/admin/models/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.models.list() }),
  })
}

// ── Model Feedback (لایک/دیس‌لایک روی پاسخ‌ها) ────────────────────────────────

interface PaginatedModelFeedback {
  items: ModelFeedbackItem[]
  total: number
  page: number
  limit: number
}

export function useModelFeedback(page: number, model?: string, vote?: string) {
  return useQuery({
    queryKey: keys.modelFeedback.list(page, model, vote),
    queryFn: () =>
      api
        .get<PaginatedModelFeedback>('/admin/model-feedback', { params: { page, model, vote } })
        .then((r) => r.data),
  })
}

export function useModelFeedbackSummary() {
  return useQuery({
    queryKey: keys.modelFeedback.summary(),
    queryFn: () => api.get<ModelFeedbackSummary | null>('/admin/model-feedback/summary').then((r) => r.data),
  })
}

export function useTriggerModelFeedbackSummary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/admin/model-feedback/trigger').then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.modelFeedback.summary() }),
  })
}
