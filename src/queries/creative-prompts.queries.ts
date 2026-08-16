import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreativePrompt } from '@/types/api'
import { keys } from './keys'

// docs/PRD-discovery-and-credits.md بخش ۵.۷ — CRUD سبک‌های آماده‌ی دیسکاوری از پنل ادمین

export function useCreativePrompts() {
  return useQuery({
    queryKey: keys.creativePrompts.list(),
    queryFn: () => api.get<CreativePrompt[]>('/admin/creative/prompts').then(r => r.data),
  })
}

// segment قدیمی دیگر از ادمین گرفته نمی‌شود — بک‌اند در create آن را خودکار با GENERAL پر می‌کند
type CreatePromptPayload = Omit<CreativePrompt, 'id' | 'createdAt' | 'updatedAt' | 'segment'> & {
  segment?: CreativePrompt['segment']
}

export function useCreateCreativePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePromptPayload) =>
      api.post<CreativePrompt>('/admin/creative/prompts', data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativePrompts.list() }),
  })
}

export function useUpdateCreativePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreativePrompt, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      api.patch<CreativePrompt>(`/admin/creative/prompts/${id}`, data).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativePrompts.list() }),
  })
}

export function useDeleteCreativePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/creative/prompts/${id}`).then(r => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.creativePrompts.list() }),
  })
}

// آپلود «عکس نمونه» یک سبک — data URL (base64) می‌فرستد، URL نهایی (پشت مسیر عمومی
// DiscoveryPublicController) برمی‌گردد؛ فرم فیلد exampleImageUrl را با این مقدار پر می‌کند
export function useUploadExampleImage() {
  return useMutation({
    mutationFn: (imageDataUrl: string) =>
      api.post<{ url: string }>('/admin/creative/prompts/example-image', { image: imageDataUrl }).then(r => r.data),
  })
}
