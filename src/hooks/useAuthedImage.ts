import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

// عکس‌هایی که پشت گارد ادمین هستند (نه پشت یک مسیر عمومی مثل example-image) را می‌گیرد —
// مثل GET /admin/creative/prompts/:id/source-image (عکس اصلی کاربر قبل از تعویض توسط ادمین).
// چون این مسیرها هدر Authorization لازم دارند، نمی‌شود مستقیم در src=<url> گذاشت؛ اینجا با
// axios (همان instance مشترک با interceptor توکن) و responseType:'blob' می‌گیریم و به
// object URL تبدیل می‌کنیم — دقیقاً همان الگوی downloadAnalyticsUsersCsv در
// src/queries/analytics.queries.ts (blob + createObjectURL)، با این تفاوت که این‌جا برای
// دانلود نیست، برای نمایش <img> است و در cleanup باید revoke شود تا blob URL لیک نکند.
export function useAuthedImage(url: string | undefined) {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!url) {
      setObjectUrl(undefined)
      setIsError(false)
      return
    }

    let cancelled = false
    let currentObjectUrl: string | undefined

    setIsLoading(true)
    setIsError(false)

    api
      .get(url, { responseType: 'blob' })
      .then(res => {
        if (cancelled) return
        currentObjectUrl = window.URL.createObjectURL(new Blob([res.data]))
        setObjectUrl(currentObjectUrl)
      })
      .catch(() => {
        if (!cancelled) setIsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      if (currentObjectUrl) window.URL.revokeObjectURL(currentObjectUrl)
    }
  }, [url])

  return { objectUrl, isLoading, isError }
}
