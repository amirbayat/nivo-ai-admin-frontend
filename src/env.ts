const VITE_API_URL = import.meta.env.VITE_API_URL as string
if (!VITE_API_URL) throw new Error('Missing env: VITE_API_URL')

// دامنه‌ی اصلی سایت (نه API) — فقط برای ساخت لینک «مشاهده»ی مقاله در ادمین استفاده می‌شود
// (docs/PRD-articles-seo-blog.md). چون /blog روی همین دامنه سرو می‌شود، نه api.*.
// اگر ست نشود، به VITE_API_URL بدون پیشوند /api/v1 برمی‌گردد (fallback برای dev سریع).
const VITE_PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? VITE_API_URL.replace(/\/api\/v1\/?$/, '')

// سرویس مجزای event tracking/funnel (events-backend) — عمداً اختیاری، بدون آن فقط
// بخش «رفتار کاربران» غیرفعال می‌ماند (نه کل پنل ادمین)
const VITE_EVENTS_API_URL = import.meta.env.VITE_EVENTS_API_URL as string | undefined

export const env = { VITE_API_URL, VITE_PUBLIC_SITE_URL, VITE_EVENTS_API_URL }
