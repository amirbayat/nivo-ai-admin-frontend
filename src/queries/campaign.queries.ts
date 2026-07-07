import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LaunchCampaign, WaitlistEntry } from '@/types/api'
import { keys } from './keys'

export function useCampaigns() {
  return useQuery({
    queryKey: keys.campaigns.list(),
    queryFn: () => api.get<LaunchCampaign[]>('/admin/campaigns').then((r) => r.data),
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<LaunchCampaign, 'id' | 'grantedCount' | 'status' | 'createdAt'>) =>
      api.post<LaunchCampaign>('/admin/campaigns', data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.campaigns.list() }),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LaunchCampaign> }) =>
      api.patch<LaunchCampaign>(`/admin/campaigns/${id}`, data).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.campaigns.list() }),
  })
}

export function useCloseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/campaigns/${id}/close`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.campaigns.list() }),
  })
}

export function useWaitlist(campaignId: string, status?: string) {
  return useQuery({
    queryKey: keys.campaigns.waitlist(campaignId, status),
    queryFn: () =>
      api
        .get<WaitlistEntry[]>(`/admin/campaigns/${campaignId}/waitlist`, { params: { status } })
        .then((r) => r.data),
    enabled: !!campaignId,
  })
}

export function useGrantAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, mode }: { campaignId: string; mode: 'all' | number }) =>
      api.post<{ granted: number }>(`/admin/campaigns/${campaignId}/grant`, { mode }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  })
}

export function useGrantAccessToPhone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (phone: string) =>
      api.post<{ granted: boolean }>('/admin/campaigns/grant-phone', { phone }).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  })
}
