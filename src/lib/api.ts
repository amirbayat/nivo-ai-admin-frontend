import axios from 'axios'
import { env } from '@/env'

const ACCESS_KEY = 'admin_access_token'
const REFRESH_KEY = 'admin_refresh_token'

export const api = axios.create({
  baseURL: env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (typeof error.config) & { _retry?: boolean }
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true
    try {
      if (!refreshing) {
        refreshing = axios
          .post<{ accessToken: string }>(
            `${env.VITE_API_URL}/auth/refresh`,
            { refreshToken: localStorage.getItem(REFRESH_KEY) },
          )
          .then((r) => {
            localStorage.setItem(ACCESS_KEY, r.data.accessToken)
            return r.data.accessToken
          })
          .finally(() => {
            refreshing = null
          })
      }
      const newToken = await refreshing
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      window.location.href = '/login'
      return Promise.reject(error)
    }
  },
)

export { ACCESS_KEY, REFRESH_KEY }
