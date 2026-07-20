import { useEffect, useRef } from 'react'
import type { CostChartPoint } from '@/types/api'

interface Props {
  data: CostChartPoint[]
  height?: number
}

// نمودار خطی canvas — درآمد در برابر هزینه‌ی AI (همون الگوی live-stats: DPR scaling +
// ResizeObserver، هر بار کامل پاک و دوباره کشیده می‌شود)
export function CostCanvasChart({ data, height = 220 }: Props) {
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
      ctx.direction = 'ltr' // صفحه‌ی ادمین RTL است؛ بدون این، متن/جهت محور کانواس معکوس می‌شود
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const PAD = { top: 50, right: 8, bottom: 24, left: 44 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, height / 2)
        return
      }

      const maxVal = Math.max(
        ...data.flatMap((d) => [d.aiCostToman, d.revenueToman, d.liaraCostToman ?? 0]),
        1,
      )
      const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW
      const y = (v: number) => PAD.top + plotH - (v / maxVal) * plotH

      // خطوط شبکه + برچسب محور عمودی (هزار تومان)
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
        ctx.fillText(`${Math.round((maxVal * (1 - i / 4)) / 1000)}k`, PAD.left - 6, gy + 3)
      }

      // خط درآمد
      ctx.beginPath()
      data.forEach((d, i) => {
        const px = x(i)
        const py = y(d.revenueToman)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.stroke()

      // خط هزینه‌ی AI (نقطه‌چین)
      ctx.beginPath()
      data.forEach((d, i) => {
        const px = x(i)
        const py = y(d.aiCostToman)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.stroke()
      ctx.setLineDash([])

      // خط هزینه‌ی واقعی Liara — فقط بازه‌هایی که رکورد دارند رسم می‌شود (null باعث قطع خط می‌شود، نه افت به صفر)
      let liaraStarted = false
      ctx.beginPath()
      data.forEach((d, i) => {
        if (d.liaraCostToman == null) {
          liaraStarted = false
          return
        }
        const px = x(i)
        const py = y(d.liaraCostToman)
        if (!liaraStarted) {
          ctx.moveTo(px, py)
          liaraStarted = true
        } else {
          ctx.lineTo(px, py)
        }
      })
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.stroke()

      // برچسب محور افقی — چند نقطه‌ی پراکنده
      const step = Math.max(1, Math.ceil(data.length / 6))
      ctx.fillStyle = '#64748b'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      data.forEach((d, i) => {
        if (i % step !== 0) return
        ctx.fillText(d.date.slice(5), x(i), height - 6)
      })

      // legend (بالا-راست)
      const legendX = width - PAD.right - 150
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(legendX, 10)
      ctx.lineTo(legendX + 18, 10)
      ctx.stroke()
      ctx.fillStyle = '#10b981'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('درآمد (تومان)', legendX + 24, 13)

      ctx.strokeStyle = '#f59e0b'
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(legendX, 24)
      ctx.lineTo(legendX + 18, 24)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#f59e0b'
      ctx.fillText('هزینه AI (تومان)', legendX + 24, 27)

      ctx.strokeStyle = '#3b82f6'
      ctx.beginPath()
      ctx.moveTo(legendX, 38)
      ctx.lineTo(legendX + 18, 38)
      ctx.stroke()
      ctx.fillStyle = '#3b82f6'
      ctx.fillText('هزینه واقعی Liara (تومان)', legendX + 24, 41)
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
