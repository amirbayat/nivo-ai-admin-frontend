import { useMutation, useQuery } from '@tanstack/react-query'
import { api, ACCESS_KEY, REFRESH_KEY } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { AdminUser } from '@/types/api'
import { keys } from './keys'

interface OtpResponse {
  message: string
}

interface VerifyResponse {
  accessToken: string
  refreshToken: string
  user: AdminUser
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) =>
      api.post<OtpResponse>('/auth/send-otp', { phone }).then((r) => r.data),
  })
}

export function useVerifyOtp() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      api.post<VerifyResponse>('/auth/verify-otp', { phone, code: otp }).then((r) => {
        const { accessToken, refreshToken, user } = r.data
        if (user.role !== 'ADMIN') {
          throw new Error('NOT_ADMIN')
        }
        localStorage.setItem(ACCESS_KEY, accessToken)
        localStorage.setItem(REFRESH_KEY, refreshToken)
        setUser(user)
        return r.data
      }),
  })
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: keys.auth.me(),
    queryFn: () =>
      api.get<AdminUser>('/auth/me').then((r) => {
        setUser(r.data)
        return r.data
      }),
    enabled: !!localStorage.getItem(ACCESS_KEY),
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSettled: () => {
      logout()
    },
  })
}
