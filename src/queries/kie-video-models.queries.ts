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
