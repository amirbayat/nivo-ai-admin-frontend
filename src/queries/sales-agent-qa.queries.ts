import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { GoldenQuestionResult, IntentGoldenResult, ImplicitNeedGoldenResult } from '@/types/api'
import { keys } from './keys'

interface QaStore {
  id: string
  name: string
  slug: string
}

export function useQaStores() {
  return useQuery({
    queryKey: keys.salesAgentQa.stores(),
    queryFn: () => api.get<QaStore[]>('/admin/sales-agent-qa/stores').then((r) => r.data),
  })
}

export function useRunGoldenSet() {
  return useMutation({
    mutationFn: (input: { storeId: string; variant: string }) =>
      api.post<GoldenQuestionResult[]>('/admin/sales-agent-qa/run', input).then((r) => r.data),
  })
}

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵.۴
export function useRunIntentGoldenSet() {
  return useMutation({
    mutationFn: (input: { variant: string }) =>
      api.post<IntentGoldenResult[]>('/admin/sales-agent-qa/run-intent', input).then((r) => r.data),
  })
}

// docs/PRD-sales-agent-implicit-need-detection.md بخش ۵ (فاز ۰)
export function useRunImplicitNeedGoldenSet() {
  return useMutation({
    mutationFn: (input: { variant: string }) =>
      api
        .post<ImplicitNeedGoldenResult[]>('/admin/sales-agent-qa/run-implicit-need', input)
        .then((r) => r.data),
  })
}
