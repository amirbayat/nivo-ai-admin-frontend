import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { KieVideoModel } from '@/types/api'
import { keys } from './keys'

export function useKieVideoModels() {
  return useQuery({
    queryKey: keys.kieVideoModels.list(),
    queryFn: () => api.get<KieVideoModel[]>('/admin/kie-video-models').then((r) => r.data),
  })
}

export type UpsertKieVideoModelData = Partial<
  Omit<KieVideoModel, 'id' | 'createdAt' | 'updatedAt'>
>

export function useCreateKieVideoModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertKieVideoModelData) =>
      api.post<KieVideoModel>('/admin/kie-video-models', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.kieVideoModels.list() }),
  })
}

export function useUpdateKieVideoModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpsertKieVideoModelData & { id: string }) =>
      api.patch<KieVideoModel>(`/admin/kie-video-models/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.kieVideoModels.list() }),
  })
}

export function useDeleteKieVideoModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/kie-video-models/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.kieVideoModels.list() }),
  })
}

export interface KieVideoModelImportResult {
  total: number
  created: number
  updated: number
  errors: Array<{ row: number; message: string }>
}

// دقیقاً هم‌الگوی useImportModels در admin.queries.ts (اکسل AiModel) — همون قرارداد
// FormData/multipart، فقط با endpoint این کاتالوگ
export function useImportKieVideoModels() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api
        .post<KieVideoModelImportResult>('/admin/kie-video-models/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.kieVideoModels.list() }),
  })
}
