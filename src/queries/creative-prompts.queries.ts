import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreativePrompt, CreativePromptSubmission } from '@/types/api'
import { keys } from './keys'

// docs/PRD-discovery-and-credits.md بخش ۵.۷ — CRUD سبک‌های آماده‌ی دیسکاوری از پنل ادمین

// تب «کاتالوگ» — همیشه باید صراحتاً sourceType=CURATED بفرستد وگرنه پیشنهادهای در حال بررسی
// کاربران (USER_EXTRACTED) هم داخل لیست اصلی می‌آیند (رفتار قدیمی سرویس بدون پارامتر: کل جدول)
export function useCreativePrompts() {
  return useQuery({
    queryKey: keys.creativePrompts.list('CURATED'),
    queryFn: () =>
      api
        .get<CreativePrompt[]>('/admin/creative/prompts', { params: { sourceType: 'CURATED' } })
        .then(r => r.data),
  })
}

// تب «پیشنهادهای کاربران» — فقط ردیف‌های در انتظار بررسی
export function usePendingCreativePromptSubmissions() {
  return useQuery({
    queryKey: keys.creativePrompts.pendingSubmissions(),
    queryFn: () =>
      api
        .get<CreativePromptSubmission[]>('/admin/creative/prompts', {
          params: { sourceType: 'USER_EXTRACTED', reviewStatus: 'PENDING' },
        })
        .then(r => r.data),
  })
}

export function usePendingSubmissionsCount() {
  return useQuery({
    queryKey: keys.creativePrompts.pendingSubmissionsCount(),
    queryFn: () =>
      api.get<number>('/admin/creative/prompts/pending-submissions-count').then(r => r.data),
  })
}

function invalidateAllPromptLists(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin', 'creative-prompts'] })
}

export function useApproveCreativePromptSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<CreativePrompt>(`/admin/creative/prompts/${id}/approve`).then(r => r.data),
    onSuccess: () => invalidateAllPromptLists(qc),
  })
}

export function useRejectCreativePromptSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<CreativePrompt>(`/admin/creative/prompts/${id}/reject`).then(r => r.data),
    onSuccess: () => invalidateAllPromptLists(qc),
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
    onSuccess: () => invalidateAllPromptLists(qc),
  })
}

// هم برای ویرایش سبک‌های کاتالوگ و هم برای ویرایش یک پیشنهاد کاربر (قبل از تایید/رد) استفاده
// می‌شود — پس هر دو لیست (کاتالوگ و پیشنهادهای در انتظار) باید رفرش شوند
export function useUpdateCreativePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<CreativePrompt, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      api.patch<CreativePrompt>(`/admin/creative/prompts/${id}`, data).then(r => r.data),
    onSuccess: () => invalidateAllPromptLists(qc),
  })
}

export function useDeleteCreativePrompt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/creative/prompts/${id}`).then(r => r.data),
    onSuccess: () => invalidateAllPromptLists(qc),
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
