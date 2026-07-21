import { useEffect, useRef } from 'react'
import type { AnonConversionQualityBucket } from '@/types/api'

interface Props {
  data: AnonConversionQualityBucket[]
  height?: number
}

// نمودار میله‌ای عمودی canvas دست‌ساز — توزیع تعداد پیام قبل از خرید؛ همان الگوی
// TrendCanvasChart/FunnelCanvasChart، بدون کتابخانه‌ی نموداری خارجی
export function HistogramCanvasChart({ data, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

      const PAD = { top: 10, right: 12, bottom: 28, left: 12 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, height / 2)
        return
      }

      const maxCount = Math.max(...data.map((d) => d.count), 1)
      const gap = 8
      const barWidth = (plotW - gap * (data.length - 1)) / data.length

      data.forEach((bucket, i) => {
        const barHeight = (bucket.count / maxCount) * plotH
        const barX = PAD.left + i * (barWidth + gap)
        const barY = PAD.top + plotH - barHeight

        ctx.fillStyle = '#0EA5E9'
        ctx.fillRect(barX, barY, barWidth, barHeight)

        ctx.fillStyle = '#1f2937'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(bucket.count), barX + barWidth / 2, barY - 4)

        ctx.fillStyle = '#64748b'
        ctx.font = '10px sans-serif'
        ctx.fillText(bucket.bucket, barX + barWidth / 2, height - 10)
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
