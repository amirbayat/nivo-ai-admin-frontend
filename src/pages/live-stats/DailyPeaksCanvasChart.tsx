import { useEffect, useRef } from 'react'
import type { DailyPeakPoint } from '@/types/api'

interface Props {
  data: DailyPeakPoint[]
  height?: number
}

function formatDay(day: string): string {
  // YYYYMMDD -> MM/DD
  return `${day.slice(4, 6)}/${day.slice(6, 8)}`
}

// نمودار خطی canvas — پیک هم‌زمانی چت به‌ازای روز (حداکثر تعداد کاربر هم‌زمانی که آن روز دیده شده)
export function DailyPeaksCanvasChart({ data, height = 220 }: Props) {
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

      const PAD = { top: 16, right: 8, bottom: 24, left: 30 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش نیست', width / 2, height / 2)
        return
      }

      const maxPeak = Math.max(...data.map((d) => d.peak), 1)
      const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW
      const y = (v: number) => PAD.top + plotH - (v / maxPeak) * plotH

      // خطوط شبکه + برچسب محور عمودی
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
      ctx.lineWidth = 1
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      for (let i = 0; i <= 4; i++) {
        const gy = PAD.top + (plotH * i) / 4
        ctx.beginPath()
        ctx.moveTo(PAD.left, gy)
        ctx.lineTo(width - PAD.right, gy)
        ctx.stroke()
        ctx.fillText(String(Math.round(maxPeak * (1 - i / 4))), PAD.left - 6, gy + 3)
      }

      // ناحیه‌ی زیر خط (fill کم‌رنگ)
      ctx.beginPath()
      ctx.moveTo(x(0), PAD.top + plotH)
      data.forEach((d, i) => ctx.lineTo(x(i), y(d.peak)))
      ctx.lineTo(x(data.length - 1), PAD.top + plotH)
      ctx.closePath()
      const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH)
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
      ctx.fillStyle = gradient
      ctx.fill()

      // خط اصلی
      ctx.beginPath()
      data.forEach((d, i) => {
        const px = x(i)
        const py = y(d.peak)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.stroke()

      // نقطه‌ی هر روز + مقدار روی آخرین نقطه
      data.forEach((d, i) => {
        ctx.beginPath()
        ctx.arc(x(i), y(d.peak), 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#10b981'
        ctx.fill()
      })
      const last = data[data.length - 1]
      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(last.peak), x(data.length - 1), y(last.peak) - 8)

      // برچسب محور افقی — چند تاریخ پراکنده
      const step = Math.max(1, Math.ceil(data.length / 7))
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      data.forEach((d, i) => {
        if (i % step !== 0) return
        ctx.fillText(formatDay(d.day), x(i), height - 6)
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
