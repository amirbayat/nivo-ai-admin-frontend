import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DiscountCode, DiscountSource, GrowthConfig, OnboardingGift } from '@/types/api'
import { keys } from './keys'

export function useGrowthConfig() {
  return useQuery({
    queryKey: keys.growth.config(),
    queryFn: () => api.get<GrowthConfig>('/admin/growth/config').then((r) => r.data),
  })
}

export function useUpdateGrowthConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<GrowthConfig, 'id' | 'updatedAt'>>) =>
      api.patch<GrowthConfig>('/admin/growth/config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.growth.config() }),
  })
}

export function useOnboardingGift() {
  return useQuery({
    queryKey: keys.growth.onboardingGift(),
    queryFn: () => api.get<OnboardingGift>('/admin/growth/onboarding-gift').then((r) => r.data),
  })
}

export function useUpdateOnboardingGift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<OnboardingGift, 'id' | 'updatedAt'>>) =>
      api.patch<OnboardingGift>('/admin/growth/onboarding-gift', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.growth.onboardingGift() }),
  })
}

export function useDiscountCodes(source?: DiscountSource) {
  return useQuery({
    queryKey: keys.growth.discountCodes(source),
    queryFn: () =>
      api
        .get<DiscountCode[]>('/admin/growth/discount-codes', { params: source ? { source } : undefined })
        .then((r) => r.data),
  })
}

export function useCreateDiscountCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { discountPercent: number; maxUses?: number; expiresAt?: string | null; codeSuffix?: string }) =>
      api.post<DiscountCode>('/admin/growth/discount-codes', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.growth.discountCodes() }),
  })
}

export function useSetDiscountCodeActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<DiscountCode>(`/admin/growth/discount-codes/${id}/active`, { isActive }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.growth.discountCodes() }),
  })
}
