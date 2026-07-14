import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DailyPeakPoint, LiveStatsSummary, LiveStatsTimeseriesPoint } from '@/types/api'
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

export function useDailyPeaks(days: number) {
  return useQuery({
    queryKey: keys.liveStats.dailyPeaks(days),
    queryFn: () =>
      api.get<DailyPeakPoint[]>('/admin/live-stats/daily-peaks', { params: { days } }).then((r) => r.data),
    refetchInterval: 60_000,
  })
}
