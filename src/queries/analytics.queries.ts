import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AnalyticsLimitHits,
  AnalyticsModelBreakdown,
  AnalyticsOverview,
  AnalyticsSegmentBreakdown,
  AnalyticsTimeseriesPoint,
  AnalyticsTopicBreakdown,
  AnalyticsUserRow,
  Topic,
  UserSegment,
} from '@/types/api'
import { keys } from './keys'

export function useAnalyticsOverview(from: string, to: string, compare: boolean) {
  return useQuery({
    queryKey: keys.analytics.overview(from, to, compare),
    queryFn: () =>
      api
        .get<AnalyticsOverview>('/admin/analytics/overview', {
          params: { from, to, compareTo: compare ? 'previous_period' : undefined },
        })
        .then((r) => r.data),
  })
}

export function useAnalyticsTimeseries(from: string, to: string, granularity: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: keys.analytics.timeseries(from, to, granularity),
    queryFn: () =>
      api
        .get<AnalyticsTimeseriesPoint[]>('/admin/analytics/timeseries', { params: { from, to, granularity } })
        .then((r) => r.data),
  })
}

export function useAnalyticsModels(from: string, to: string) {
  return useQuery({
    queryKey: keys.analytics.models(from, to),
    queryFn: () => api.get<AnalyticsModelBreakdown[]>('/admin/analytics/models', { params: { from, to } }).then((r) => r.data),
  })
}

export function useAnalyticsTopics(from: string, to: string) {
  return useQuery({
    queryKey: keys.analytics.topics(from, to),
    queryFn: () => api.get<AnalyticsTopicBreakdown[]>('/admin/analytics/topics', { params: { from, to } }).then((r) => r.data),
  })
}

export function useAnalyticsLimitHits(from: string, to: string) {
  return useQuery({
    queryKey: keys.analytics.limitHits(from, to),
    queryFn: () => api.get<AnalyticsLimitHits>('/admin/analytics/limit-hits', { params: { from, to } }).then((r) => r.data),
  })
}

export function useAnalyticsUsers(from: string, to: string, segment?: string) {
  return useQuery({
    queryKey: keys.analytics.users(from, to, segment),
    queryFn: () =>
      api
        .get<AnalyticsUserRow[]>('/admin/analytics/users', { params: { from, to, segment } })
        .then((r) => r.data),
  })
}

export async function downloadAnalyticsUsersCsv(from: string, to: string, segment?: string) {
  const res = await api.get('/admin/analytics/users/export', {
    params: { from, to, segment },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = `usage-analytics-${from}_${to}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function useAnalyticsSegments() {
  return useQuery({
    queryKey: keys.analytics.segments(),
    queryFn: () => api.get<UserSegment[]>('/admin/analytics/segments').then((r) => r.data),
  })
}

export function useAnalyticsSegmentBreakdown(from: string, to: string) {
  return useQuery({
    queryKey: keys.analytics.segmentBreakdown(from, to),
    queryFn: () =>
      api
        .get<{ current: AnalyticsSegmentBreakdown[] }>('/admin/analytics/segments/breakdown', { params: { from, to } })
        .then((r) => r.data.current),
  })
}

export function useCreateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<UserSegment, 'id'>) =>
      api.post<UserSegment>('/admin/analytics/segments', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.segments() }),
  })
}

export function useUpdateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<UserSegment, 'id'>> }) =>
      api.patch<UserSegment>(`/admin/analytics/segments/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.segments() }),
  })
}

export function useDeleteSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/analytics/segments/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.segments() }),
  })
}

export function useTopics() {
  return useQuery({
    queryKey: keys.analytics.topicsList(),
    queryFn: () => api.get<Topic[]>('/admin/topics').then((r) => r.data),
  })
}

export function useCreateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Topic, 'id'>) => api.post<Topic>('/admin/topics', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.topicsList() }),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Topic, 'id'>> }) =>
      api.patch<Topic>(`/admin/topics/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.topicsList() }),
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.analytics.topicsList() }),
  })
}
