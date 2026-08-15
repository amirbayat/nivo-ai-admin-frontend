import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreativeCategory } from '@/types/api'
import { keys } from './keys'

// docs/PRD-discovery-and-credits.md — درخت دسته‌بندی دیسکاوری (ادمین‌قابل‌تعریف)

export function useCreativeCategories() {
  return useQuery({
    queryKey: keys.creativeCategories.list(),
    queryFn: () => api.get<CreativeCategory[]>('/admin/creative/categories').then(r => r.data),
  })
}

export function useCreateCreativeCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; parentId?: string; sortOrder?: number }) =>
      api.post<CreativeCategory>('/admin/creative/categories', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativeCategories.list() }),
  })
}

export function useUpdateCreativeCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; parentId: string | null; sortOrder: number; isActive: boolean }> }) =>
      api.patch<CreativeCategory>(`/admin/creative/categories/${id}`, data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativeCategories.list() }),
  })
}

export function useDeleteCreativeCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/creative/categories/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativeCategories.list() }),
  })
}
