import { useEffect, useRef } from 'react'

interface Props {
  data: { day: string; count: number }[]
  height?: number
}

// نمودار میله‌ای canvas — حجم روزانه‌ی ایونت‌ها، هم‌الگو با TrendCanvasChart.tsx (بخش analytics)
export function VolumeCanvasChart({ data, height = 220 }: Props) {
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

      const PAD = { top: 16, right: 8, bottom: 24, left: 16 }
      const plotW = width - PAD.left - PAD.right
      const plotH = height - PAD.top - PAD.bottom

      if (!data.length) {
        ctx.fillStyle = '#64748b'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, height / 2)
        return
      }

      const max = Math.max(...data.map((d) => d.count), 1)
      const barW = (plotW / data.length) * 0.7
      const gap = (plotW / data.length) * 0.3

      data.forEach((d, i) => {
        const x = PAD.left + i * (barW + gap)
        const barH = (d.count / max) * plotH
        const y = PAD.top + plotH - barH
        ctx.fillStyle = '#0EA5E9'
        ctx.fillRect(x, y, barW, barH)
      })

      const step = Math.max(1, Math.ceil(data.length / 8))
      ctx.fillStyle = '#64748b'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      data.forEach((d, i) => {
        if (i % step !== 0) return
        const x = PAD.left + i * (barW + gap) + barW / 2
        ctx.fillText(d.day.slice(5), x, height - 6)
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
