import axios from 'axios'
import { env } from '@/env'
import { ACCESS_KEY } from '@/lib/api'

// events-backend سرویس کاملاً مجزایی است (DB/Redis جدا، بدون اشتراک با back-end اصلی) —
// همان توکن ادمین را می‌فرستد، چون events-backend نقش را مستقیم از claim توی JWT (بدون DB)
// تایید می‌کند، نه از سشن مشترک. رفرش توکن این‌جا لازم نیست: با 401 کاربر باید دوباره در
// همان api اصلی لاگین کند که access_token مشترک را تازه می‌کند.
export const eventsApi = axios.create({
  baseURL: env.VITE_EVENTS_API_URL,
})

eventsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
