import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ContentAgentApiKey } from '@/types/api'
import { keys } from './keys'

export function useApiKeys() {
  return useQuery({
    queryKey: keys.contentAgentApiKeys.list(),
    queryFn: () =>
      api.get<ContentAgentApiKey[]>('/admin/content-agent/api-keys').then((r) => r.data),
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { label: string }) =>
      api
        .post<{ id: string; rawKey: string }>('/admin/content-agent/api-keys', data)
        .then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.contentAgentApiKeys.list() }),
  })
}

export function useSetApiKeyActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api
        .patch<ContentAgentApiKey>(`/admin/content-agent/api-keys/${id}`, { isActive })
        .then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.contentAgentApiKeys.list() }),
  })
}
