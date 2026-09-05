import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CaptionPricingTier } from '@/types/api'
import { keys } from './keys'

export function useCaptionPricingTiers() {
  return useQuery({
    queryKey: keys.captionPricingTiers.all(),
    queryFn: () => api.get<CaptionPricingTier[]>('/admin/caption-pricing-tiers').then(r => r.data),
  })
}

export function useCreateCaptionPricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CaptionPricingTier, 'id' | 'createdAt' | 'updatedAt'>) =>
      api.post<CaptionPricingTier>('/admin/caption-pricing-tiers', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.captionPricingTiers.all() }),
  })
}

export function useUpdateCaptionPricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CaptionPricingTier, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      api.patch<CaptionPricingTier>(`/admin/caption-pricing-tiers/${id}`, data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.captionPricingTiers.all() }),
  })
}

export function useDeleteCaptionPricingTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/caption-pricing-tiers/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.captionPricingTiers.all() }),
  })
}
