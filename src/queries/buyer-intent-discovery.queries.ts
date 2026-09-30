import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { BuyerIntentDiscoveryResponse } from '@/types/api'
import { keys } from './keys'

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵
interface BuyerIntentDiscoveryParams {
  storeId?: string
  from?: string
  to?: string
}

export function useBuyerIntentDiscovery(params: BuyerIntentDiscoveryParams) {
  const { storeId, from, to } = params
  return useQuery({
    queryKey: keys.buyerIntentDiscovery.report(storeId, from, to),
    queryFn: () =>
      api
        .get<BuyerIntentDiscoveryResponse>('/admin/sales-agent/buyer-intent-discovery', {
          params: { storeId, from, to },
        })
        .then((r) => r.data),
  })
}
