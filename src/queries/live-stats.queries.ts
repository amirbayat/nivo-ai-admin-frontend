import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LiveStatsSummary, LiveStatsTimeseriesPoint } from '@/types/api'
import { keys } from './keys'

export function useLiveStatsSummary() {
  return useQuery({
    queryKey: keys.liveStats.summary(),
    queryFn: () => api.get<LiveStatsSummary>('/admin/live-stats/summary').then((r) => r.data),
    refetchInterval: 4000,
  })
}

export function useLiveStatsTimeseries(minutes: number) {
  return useQuery({
    queryKey: keys.liveStats.timeseries(minutes),
    queryFn: () =>
      api.get<LiveStatsTimeseriesPoint[]>('/admin/live-stats/timeseries', { params: { minutes } }).then((r) => r.data),
    refetchInterval: 15000,
  })
}
