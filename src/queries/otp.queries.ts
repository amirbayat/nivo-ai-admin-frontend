import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ActiveOtp } from '@/types/api'
import { keys } from './keys'

export function useActiveOtps() {
  return useQuery({
    queryKey: keys.otp.list(),
    queryFn: () => api.get<ActiveOtp[]>('/admin/otp').then((r) => r.data),
    refetchInterval: 5000,
    retry: false,
  })
}
