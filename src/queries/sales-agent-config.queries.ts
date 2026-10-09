import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SalesAgentGlobalConfig } from '@/types/api'
import { keys } from './keys'

// docs/PRD-sales-agent-checkout-pricing-and-roadmap.md بخش ۶.۵

export function useSalesAgentConfig() {
  return useQuery({
    queryKey: keys.salesAgentConfig.config(),
    queryFn: () => api.get<SalesAgentGlobalConfig>('/admin/sales-agent/global-config').then(r => r.data),
  })
}

export function useUpdateSalesAgentConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<
          SalesAgentGlobalConfig,
          | 'freeDailyQuota'
          | 'trialDurationDays'
          | 'trialCreditToman'
          | 'buyerCostMarkup'
          | 'sellerCostMarkup'
          | 'avgCostPerChatToman'
        >
      >,
    ) => api.patch<SalesAgentGlobalConfig>('/admin/sales-agent/global-config', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.salesAgentConfig.config() }),
  })
}
