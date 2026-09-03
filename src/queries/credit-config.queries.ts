import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreditConfig, CreditPackage } from '@/types/api'
import { keys } from './keys'

// docs/PRD-discovery-and-credits.md بخش ۵.۷ — تنظیمات نیوو + بسته‌های خرید، از پنل ادمین

export function useCreditConfig() {
  return useQuery({
    queryKey: keys.creditConfig.config(),
    queryFn: () => api.get<CreditConfig>('/admin/creative/credit-config').then(r => r.data),
  })
}

export function useUpdateCreditConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<
          CreditConfig,
          | 'tomanPerCredit'
          | 'purchaseMarkup'
          | 'roundingSteps'
          | 'freeSignupCredits'
          | 'extractionEconomicalModel'
          | 'extractionEconomicalCreditCost'
          | 'extractionPremiumModel'
          | 'extractionPremiumCreditCost'
        >
      >,
    ) => api.patch<CreditConfig>('/admin/creative/credit-config', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creditConfig.config() }),
  })
}

export function useCreditPackages() {
  return useQuery({
    queryKey: keys.creditConfig.packages(),
    queryFn: () => api.get<CreditPackage[]>('/admin/creative/credit-packages').then(r => r.data),
  })
}

export function useCreateCreditPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<CreditPackage, 'id' | 'createdAt'>) =>
      api.post<CreditPackage>('/admin/creative/credit-packages', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creditConfig.packages() }),
  })
}

export function useUpdateCreditPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreditPackage, 'id' | 'createdAt'>> }) =>
      api.patch<CreditPackage>(`/admin/creative/credit-packages/${id}`, data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creditConfig.packages() }),
  })
}

export function useDeleteCreditPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/creative/credit-packages/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creditConfig.packages() }),
  })
}
