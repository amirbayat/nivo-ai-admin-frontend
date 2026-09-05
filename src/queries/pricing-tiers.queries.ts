import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PricingTier } from '@/types/api'
import { keys } from './keys'

// جایگزین ضریب ثابت Plan.payAsYouGoMarkup — پله‌های مارک‌آپ per-type (متن/عکس/ویدیو)،
// از پنل ادمین کاملاً CRUD می‌شود

export function usePricingTiers() {
  return useQuery({
    queryKey: keys.pricingTiers.all(),
    queryFn: () => api.get<PricingTier[]>('/admin/pricing-tiers').then(r => r.data),
  })
}

export function useCreatePricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<PricingTier, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.post<PricingTier>('/admin/pricing-tiers', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.pricingTiers.all() }),
  })
}

export function useUpdatePricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<PricingTier, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      api.patch<PricingTier>(`/admin/pricing-tiers/${id}`, data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.pricingTiers.all() }),
  })
}

export function useDeletePricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/pricing-tiers/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.pricingTiers.all() }),
  })
}
