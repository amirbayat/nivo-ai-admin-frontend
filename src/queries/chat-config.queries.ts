import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ChatConfig } from '@/types/api'
import { keys } from './keys'

export function useChatConfig() {
  return useQuery({
    queryKey: keys.chatConfig.detail(),
    queryFn: () => api.get<ChatConfig>('/admin/chat-config').then((r) => r.data),
  })
}

export function useUpdateChatConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<ChatConfig, 'id' | 'updatedAt'>>) =>
      api.patch<ChatConfig>('/admin/chat-config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.chatConfig.detail() }),
  })
}
