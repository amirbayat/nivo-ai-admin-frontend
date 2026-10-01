import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AbModelStat,
  AdPlacementInstrumentation,
  CartRecoveryInstrumentation,
  ConversationTraceResponse,
  FollowUpInstrumentation,
  PaginatedFailedMessages,
} from '@/types/api'
import { keys } from './keys'

interface AbStatsParams {
  groupBy: 'variant' | 'channel' | 'voiceVariant' | 'responseStrategy'
  storeId?: string
  from?: string
  to?: string
}

export function useAbStats(params: AbStatsParams) {
  const { groupBy, storeId, from, to } = params
  return useQuery({
    queryKey: keys.salesAgentQuality.abStats(groupBy, storeId, from, to),
    queryFn: () =>
      api
        .get<AbModelStat[]>('/admin/sales-agent/ab-stats', { params: { groupBy, storeId, from, to } })
        .then((r) => r.data),
  })
}

interface FailedMessagesParams {
  page: number
  storeId?: string
  variant?: string
  reason?: 'UNCLEAR' | 'NO_KB_MATCH'
  from?: string
  to?: string
}

export function useFailedMessages(params: FailedMessagesParams) {
  const { page, storeId, variant, reason, from, to } = params
  return useQuery({
    queryKey: keys.salesAgentQuality.failedMessages(page, storeId, variant, reason, from, to),
    queryFn: () =>
      api
        .get<PaginatedFailedMessages>('/admin/sales-agent/failed-messages', {
          params: { page, storeId, variant, reason, from, to },
        })
        .then((r) => r.data),
  })
}

interface InstrumentationParams {
  storeId?: string
  from?: string
  to?: string
}

export function useFollowUpInstrumentation(params: InstrumentationParams) {
  const { storeId, from, to } = params
  return useQuery({
    queryKey: keys.salesAgentQuality.followUpInstrumentation(storeId, from, to),
    queryFn: () =>
      api
        .get<FollowUpInstrumentation>('/admin/sales-agent/followup-instrumentation', {
          params: { storeId, from, to },
        })
        .then((r) => r.data),
  })
}

export function useCartRecoveryInstrumentation(params: InstrumentationParams) {
  const { storeId, from, to } = params
  return useQuery({
    queryKey: keys.salesAgentQuality.cartRecoveryInstrumentation(storeId, from, to),
    queryFn: () =>
      api
        .get<CartRecoveryInstrumentation>('/admin/sales-agent/cart-recovery-instrumentation', {
          params: { storeId, from, to },
        })
        .then((r) => r.data),
  })
}

export function useAdPlacementInstrumentation(storeId?: string) {
  return useQuery({
    queryKey: keys.salesAgentQuality.adPlacementInstrumentation(storeId),
    queryFn: () =>
      api
        .get<AdPlacementInstrumentation>('/admin/sales-agent/ad-placement-instrumentation', { params: { storeId } })
        .then((r) => r.data),
  })
}

// فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — بدون این refetchInterval، اگر درِاور وقتی وویس هنوز در حال
// تولید است باز شود، تا ابد روی «در حال ساخت...» می‌ماند، حتی بعد از اینکه بک‌اند نتیجه‌ی
// نهایی (موفق/FAILED) را persist کرده؛ فقط وقتی حداقل یک آیتم واقعاً pending است poll می‌کنیم
function hasPendingVoice(data: ConversationTraceResponse | undefined): boolean {
  return !!data?.items.some((item) => item.trace?.voice?.generated && !item.trace.voice.voiceName)
}

export function useConversationTrace(conversationId: string | null) {
  return useQuery({
    queryKey: keys.salesAgentQuality.trace(conversationId ?? ''),
    queryFn: () =>
      api
        .get<ConversationTraceResponse>(`/admin/sales-agent/conversations/${conversationId}/trace`)
        .then((r) => r.data),
    enabled: !!conversationId,
    refetchInterval: (query) => (hasPendingVoice(query.state.data) ? 3500 : false),
  })
}
