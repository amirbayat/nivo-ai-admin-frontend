import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { VideoEditConfig } from '@/types/api'
import { keys } from './keys'

export function useVideoEditConfig() {
  return useQuery({
    queryKey: keys.videoEditConfig.detail(),
    queryFn: () => api.get<VideoEditConfig>('/admin/video-edit-config').then((r) => r.data),
  })
}

export function useUpdateVideoEditConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<VideoEditConfig, 'id' | 'updatedAt'>>) =>
      api.patch<VideoEditConfig>('/admin/video-edit-config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.videoEditConfig.detail() }),
  })
}
