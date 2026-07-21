import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AnonymousChatConfig } from '@/types/api'
import { keys } from './keys'

export function useAnonChatConfig() {
  return useQuery({
    queryKey: keys.anonChatConfig.detail(),
    queryFn: () => api.get<AnonymousChatConfig>('/admin/anon-chat-config').then((r) => r.data),
  })
}

export function useUpdateAnonChatConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<AnonymousChatConfig, 'id' | 'updatedAt'>>) =>
      api.patch<AnonymousChatConfig>('/admin/anon-chat-config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.anonChatConfig.detail() }),
  })
}
