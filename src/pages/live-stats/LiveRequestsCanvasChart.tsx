import { useEffect, useRef } from 'react'
import type { LiveStatsTimeseriesPoint } from '@/types/api'

interface Props {
  data: LiveStatsTimeseriesPoint[]
  height?: number
}

// نمودار canvas سبک/سریع — بارها در دقیقه ری‌رندر می‌شود (پول هر ۱۵ ثانیه)، برخلاف SVG
// نیازی به diff کردن DOM ندارد؛ هر بار کامل پاک و دوباره کشیده می‌شود
export function LiveRequestsCanvasChart({ data, height = 220 }: Props) {
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const PAD = { top: 16, right: 8, bottom: 24, left: 34 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length || data.every((d) => d.total === 0)) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('در این بازه هنوز درخواستی ثبت نشده', width / 2, height / 2)
        return
      }

      const maxTotal = Math.max(...data.map((d) => d.total), 1)

      // خطوط شبکه + برچسب محور عمودی
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
      ctx.lineWidth = 1
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 4; i++) {
        const y = PAD.top + (plotH * i) / 4
        ctx.beginPath()
        ctx.moveTo(PAD.left, y)
        ctx.lineTo(width - PAD.right, y)
        ctx.stroke()
        ctx.fillText(String(Math.round(maxTotal * (1 - i / 4))), PAD.left - 6, y + 3)
      }

      // میله‌های stacked — موفق (سبز) پایین، ناموفق (قرمز) روی آن
      const gap = 2
      const barWidth = Math.max(1, plotW / data.length - gap)
      data.forEach((d, i) => {
        const x = PAD.left + i * (barWidth + gap)
        const successH = (d.success / maxTotal) * plotH
        const failH = (d.fail / maxTotal) * plotH

        if (d.success > 0) {
          ctx.fillStyle = '#10b981'
          ctx.fillRect(x, PAD.top + plotH - successH, barWidth, successH)
        }
        if (d.fail > 0) {
          ctx.fillStyle = '#ef4444'
          ctx.fillRect(x, PAD.top + plotH - successH - failH, barWidth, Math.max(failH, d.fail > 0 ? 1.5 : 0))
        }
      })

      // برچسب محور افقی — چند نقطه‌ی پراکنده، نه هر دقیقه
      const step = Math.max(1, Math.ceil(data.length / 6))
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'center'
      data.forEach((d, i) => {
        if (i % step !== 0) return
        const x = PAD.left + i * (barWidth + gap) + barWidth / 2
        const hh = d.bucket.slice(8, 10)
        const mm = d.bucket.slice(10, 12)
        ctx.fillText(`${hh}:${mm}`, x, height - 6)
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
