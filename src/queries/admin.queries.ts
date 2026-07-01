import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AdminUser,
  CostChartPoint,
  DashboardStats,
  ManualLimit,
  Plan,
  PricingAlert,
  FeedbackItem,
  FeedbackSummary,
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
