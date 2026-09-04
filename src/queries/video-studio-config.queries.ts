import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { VideoStudioConfig } from '@/types/api'
import { keys } from './keys'

export function useVideoStudioConfig() {
  return useQuery({
    queryKey: keys.videoStudioConfig.detail(),
    queryFn: () => api.get<VideoStudioConfig>('/admin/video-studio-config').then((r) => r.data),
  })
}

export function useUpdateVideoStudioConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<VideoStudioConfig, 'id' | 'updatedAt'>>) =>
      api.patch<VideoStudioConfig>('/admin/video-studio-config', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.videoStudioConfig.detail() }),
  })
}
