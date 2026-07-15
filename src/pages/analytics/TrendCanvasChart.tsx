import { useEffect, useRef } from 'react'
import type { AnalyticsTimeseriesPoint } from '@/types/api'

interface Props {
  data: AnalyticsTimeseriesPoint[]
  height?: number
}

// نمودار خطی canvas — روند توکن مصرفی در برابر هزینه؛ این دو مقیاس y کاملاً جدا از هم دارند
// (بر خلاف بقیه‌ی نمودارهای canvas این پروژه) چون واحد و مقیاسشون قابل‌مقایسه نیست
export function TrendCanvasChart({ data, height = 220 }: Props) {
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
      ctx.direction = 'ltr'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const PAD = { top: 36, right: 8, bottom: 24, left: 16 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, height / 2)
        return
      }

      const maxTokens = Math.max(...data.map((d) => d.tokens), 1)
      const maxCost = Math.max(...data.map((d) => d.costToman), 1)
      const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW
      const yTokens = (v: number) => PAD.top + plotH - (v / maxTokens) * plotH
      const yCost = (v: number) => PAD.top + plotH - (v / maxCost) * plotH

      // خطوط شبکه (بدون برچسب مقدار — دو مقیاس جدا با واحد یکی نیست)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const gy = PAD.top + (plotH * i) / 4
        ctx.beginPath()
        ctx.moveTo(PAD.left, gy)
        ctx.lineTo(width - PAD.right, gy)
        ctx.stroke()
      }

      // خط توکن
      ctx.beginPath()
      data.forEach((d, i) => {
        const px = x(i)
        const py = yTokens(d.tokens)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#0EA5E9'
      ctx.lineWidth = 2
      ctx.stroke()

      // خط هزینه (نقطه‌چین)
      ctx.beginPath()
      data.forEach((d, i) => {
        const px = x(i)
        const py = yCost(d.costToman)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // برچسب محور افقی
      const step = Math.max(1, Math.ceil(data.length / 8))
      ctx.fillStyle = '#64748b'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      data.forEach((d, i) => {
        if (i % step !== 0) return
        ctx.fillText((d.date ?? d.period ?? '').slice(5), x(i), height - 6)
      })

      // legend (بالا-راست)
      const legendX = width - PAD.right - 150
      ctx.strokeStyle = '#0EA5E9'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(legendX, 10)
      ctx.lineTo(legendX + 18, 10)
      ctx.stroke()
      ctx.fillStyle = '#0EA5E9'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('توکن', legendX + 24, 13)

      ctx.strokeStyle = '#F59E0B'
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(legendX, 24)
      ctx.lineTo(legendX + 18, 24)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#F59E0B'
      ctx.fillText('هزینه (تومان)', legendX + 24, 27)
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
