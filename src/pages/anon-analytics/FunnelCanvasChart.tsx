import { useEffect, useRef } from 'react'
import type { AnonFunnelStage } from '@/types/api'

interface Props {
  data: AnonFunnelStage[]
}

const ROW_HEIGHT = 74
const BAR_HEIGHT = 32

// نمودار canvas دست‌ساز فانل تبدیل — هر مرحله یک نوار افقی که عرضش متناسب با شمارش آن مرحله
// نسبت به مرحله‌ی اول کوچک می‌شود؛ همان الگوی TrendCanvasChart (src/pages/analytics)، فقط
// به‌جای خط، نوار افقی رسم می‌شود. هیچ کتابخانه‌ی نموداری خارجی استفاده نمی‌شود.
export function FunnelCanvasChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const height = Math.max(data.length * ROW_HEIGHT + 16, 200)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function draw() {
      const width = container!.clientWidth
      if (width === 0) return
      const dpr = window.devicePixelRatio || 1

      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`

      const ctx = canvas!.getContext('2d')
      if (!ctx) return
      ctx.direction = 'rtl'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, height / 2)
        return
      }

      const PAD_X = 16
      const usableWidth = width - PAD_X * 2
      const maxCount = Math.max(...data.map((d) => d.count), 1)

      data.forEach((stage, i) => {
        const top = 8 + i * ROW_HEIGHT
        const barWidth = Math.max((stage.count / maxCount) * usableWidth, 3)
        const barX = PAD_X + (usableWidth - barWidth) / 2
        const barY = top + 20

        // برچسب مرحله + شمارش، بالای نوار
        ctx.fillStyle = '#1f2937'
        ctx.font = '600 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${stage.label} — ${stage.count.toLocaleString('fa-IR')}`, width / 2, top + 12)

        // خود نوار
        const hue = 205 - i * 12
        ctx.fillStyle = `hsl(${hue}, 72%, 55%)`
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath()
          ctx.roundRect(barX, barY, barWidth, BAR_HEIGHT, 5)
          ctx.fill()
        } else {
          ctx.fillRect(barX, barY, barWidth, BAR_HEIGHT)
        }

        // درصد افت نسبت به مرحله‌ی قبل، زیر نوار (به‌جز مرحله‌ی اول)
        if (i > 0) {
          ctx.fillStyle = stage.dropOffPct > 50 ? '#ef4444' : '#f97316'
          ctx.font = '11px sans-serif'
          ctx.fillText(`افت ${stage.dropOffPct.toFixed(1)}٪ نسبت به مرحله‌ی قبل`, width / 2, barY + BAR_HEIGHT + 16)
        }
      })
    }

    draw()
    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [data, height])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
