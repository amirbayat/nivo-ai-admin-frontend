import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AnonAnalyticsCampaignRow,
  AnonAnalyticsOverview,
  AnonAnalyticsSessionsResult,
  AnonAnalyticsTimeseriesPoint,
  AnonConversionPathSegment,
  AnonConversionQuality,
  AnonFunnelStage,
  AnonSessionMessage,
} from '@/types/api'
import { keys } from './keys'

export function useAnonAnalyticsOverview(from: string, to: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.overview(from, to),
    queryFn: () =>
      api.get<AnonAnalyticsOverview>('/admin/anon-analytics/overview', { params: { from, to } }).then((r) => r.data),
  })
}

export function useAnonAnalyticsTimeseries(from: string, to: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.timeseries(from, to),
    queryFn: () =>
      api
        .get<AnonAnalyticsTimeseriesPoint[]>('/admin/anon-analytics/timeseries', { params: { from, to } })
        .then((r) => r.data),
  })
}

export function useAnonAnalyticsSessions(
  from: string,
  to: string,
  page: number,
  pageSize: number,
  utmSource?: string,
  utmCampaign?: string,
) {
  return useQuery({
    queryKey: keys.anonAnalytics.sessions(from, to, page, pageSize, utmSource, utmCampaign),
    queryFn: () =>
      api
        .get<AnonAnalyticsSessionsResult>('/admin/anon-analytics/sessions', {
          params: { from, to, page, pageSize, utmSource: utmSource || undefined, utmCampaign: utmCampaign || undefined },
        })
        .then((r) => r.data),
  })
}

// درخواستی، نه auto-fetch — فقط وقتی ادمین روی یک مکالمه‌ی مشخص در مودال drilldown کلیک می‌کند
export async function fetchAnonSessionConversationMessages(conversationId: string) {
  const res = await api.get<AnonSessionMessage[]>(
    `/admin/anon-analytics/sessions/conversations/${conversationId}/messages`,
  )
  return res.data
}

export function useAnonAnalyticsFunnel(from: string, to: string, utmSource?: string, utmCampaign?: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.funnel(from, to, utmSource, utmCampaign),
    queryFn: () =>
      api
        .get<AnonFunnelStage[]>('/admin/anon-analytics/funnel', {
          params: { from, to, utmSource: utmSource || undefined, utmCampaign: utmCampaign || undefined },
        })
        .then((r) => r.data),
  })
}

// چهار مسیر محتمل تبدیل (early/limitedZone/forced/blockedLost) — نگاه کن به توضیح کامل در
// anon-analytics.service.ts سمت بک‌اند؛ فانل ترکیبی (useAnonAnalyticsFunnel) همه را روی هم
// می‌ریزد، این endpoint نشان می‌دهد کدام مسیر واقعاً کاربران را تبدیل کرده
export function useAnonAnalyticsConversionPaths(from: string, to: string, utmSource?: string, utmCampaign?: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.conversionPaths(from, to, utmSource, utmCampaign),
    queryFn: () =>
      api
        .get<AnonConversionPathSegment[]>('/admin/anon-analytics/conversion-paths', {
          params: { from, to, utmSource: utmSource || undefined, utmCampaign: utmCampaign || undefined },
        })
        .then((r) => r.data),
  })
}

export function useAnonAnalyticsCampaigns(from: string, to: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.campaigns(from, to),
    queryFn: () =>
      api.get<AnonAnalyticsCampaignRow[]>('/admin/anon-analytics/campaigns', { params: { from, to } }).then((r) => r.data),
  })
}

export function useAnonAnalyticsConversionQuality(from: string, to: string) {
  return useQuery({
    queryKey: keys.anonAnalytics.conversionQuality(from, to),
    queryFn: () =>
      api
        .get<AnonConversionQuality>('/admin/anon-analytics/conversion-quality', { params: { from, to } })
        .then((r) => r.data),
  })
}
