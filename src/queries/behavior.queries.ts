import { useMutation, useQuery } from '@tanstack/react-query'
import { eventsApi } from '@/lib/eventsApi'
import { keys } from '@/queries/keys'

export interface EventRecord {
  id: string
  eventName: string
  anonymousId: string
  userId: string | null
  sessionId: string
  properties: Record<string, unknown>
  url: string | null
  referrer: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  receivedAt: string
}

export interface OverviewResponse {
  daily: { day: string; count: number }[]
  topEvents: { eventName: string; count: number }[]
}

export function useBehaviorOverview(from: string, to: string) {
  return useQuery({
    queryKey: keys.behavior.overview(from, to),
    queryFn: () => eventsApi.get<OverviewResponse>('/query/overview', { params: { from, to } }).then((r) => r.data),
  })
}

export interface FunnelStep {
  eventName: string
  filters?: Record<string, string | number | boolean>
}

export interface FunnelStepResult {
  eventName: string
  count: number
  conversionFromStart: number
  conversionFromPrevious: number
}

export function useFunnel() {
  return useMutation({
    mutationFn: (input: { steps: FunnelStep[]; from: string; to: string; windowHours?: number }) =>
      eventsApi.post<{ steps: FunnelStepResult[] }>('/query/funnel', input).then((r) => r.data),
  })
}

export function useJourney(actorId: string) {
  return useQuery({
    queryKey: keys.behavior.journey(actorId),
    queryFn: () => eventsApi.get<EventRecord[]>(`/query/journey/${actorId}`).then((r) => r.data),
    enabled: !!actorId,
  })
}

export function useTopNextEvents(after: string, from: string, to: string) {
  return useQuery({
    queryKey: keys.behavior.topNextEvents(after, from, to),
    queryFn: () =>
      eventsApi
        .get<{ nextEvent: string; count: number }[]>('/query/top-next-events', { params: { after, from, to } })
        .then((r) => r.data),
    enabled: !!after,
  })
}

export interface EventExplorerFilters {
  eventName?: string
  userId?: string
  anonymousId?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export function useEventExplorer(filters: EventExplorerFilters) {
  return useQuery({
    queryKey: keys.behavior.explorer(filters.page ?? 1, filters.eventName, filters.userId),
    queryFn: () =>
      eventsApi
        .get<{ items: EventRecord[]; total: number; page: number; pageSize: number }>('/query/events', {
          params: filters,
        })
        .then((r) => r.data),
  })
}

// برای autocomplete فیلترهایی مثل کمپین (utm_campaign) در Funnel Builder — لیست مقادیر
// واقعی دیده‌شده، نه یک لیست هاردکد
export function useDimensionValues(key: string, from: string, to: string) {
  return useQuery({
    queryKey: keys.behavior.dimensionValues(key, from, to),
    queryFn: () =>
      eventsApi
        .get<{ value: string; count: number }[]>('/query/dimension-values', { params: { key, from, to } })
        .then((r) => r.data),
    enabled: !!key.trim(),
  })
}
