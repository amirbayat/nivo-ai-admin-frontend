import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NetworkOutage } from '@/types/api'
import { keys } from './keys'

export function useCurrentOutage() {
  return useQuery({
    queryKey: keys.networkOutage.current(),
    queryFn: () => api.get<NetworkOutage | null>('/admin/network-outage/current').then((r) => r.data),
    refetchInterval: 10_000,
  })
}

export function useOutageHistory(limit = 20) {
  return useQuery({
    queryKey: keys.networkOutage.history(limit),
    queryFn: () =>
      api.get<NetworkOutage[]>('/admin/network-outage/history', { params: { limit } }).then((r) => r.data),
  })
}

export function useStartOutage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<NetworkOutage>('/admin/network-outage/start').then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.networkOutage.current() }),
  })
}

export function useEndOutage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<NetworkOutage>('/admin/network-outage/end').then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.networkOutage.current() })
      void qc.invalidateQueries({ queryKey: ['admin', 'network-outage', 'history'] })
    },
  })
}
