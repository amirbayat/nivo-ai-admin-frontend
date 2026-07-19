import { useEffect, useRef, useState } from 'react'
import type { FunnelStepResult } from '@/queries/behavior.queries'

interface Props {
  steps: FunnelStepResult[]
}

// یک‌رنگ (blue) با روشنایی نزولی برای مراحل — چون funnel یک کمیت واحد است که پله‌پله
// کم می‌شود (ordinal ramp)، نه چند سری متفاوت؛ طبق قاعده‌ی dataviz skill (single hue,
// monotone lightness) — از تیره (مرحله‌ی اول) به روشن، اما هیچ‌وقت روشن‌تر از سقف خوانایی
// روی سطح روشن (step 250) نمی‌رود. اعتبارسنجی‌شده با scripts/validate_palette.js --ordinal
const ORDINAL_RAMP = [
  '#0d366b', '#104281', '#184f95', '#1c5cab', '#256abf',
  '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef',
]
const CRITICAL = '#d03b3b'
const MUTED_INK = '#898781'
const PRIMARY_INK = '#0b0b0b'
const TRACK = '#e1e0d9'

function colorForStep(index: number, total: number) {
  if (total <= 1) return ORDINAL_RAMP[0]
  const t = index / (total - 1)
  return ORDINAL_RAMP[Math.round(t * (ORDINAL_RAMP.length - 1))]
}

const BAR_H = 24
const ROW_H = 72
const PAD_TOP = 28

export function FunnelCanvasChart({ steps }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const chartHeight = Math.max(steps.length * ROW_H + PAD_TOP, 120)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function draw() {
      const width = container!.clientWidth
      if (width === 0) return
      const dpr = window.devicePixelRatio || 1

      canvas!.width = width * dpr
      canvas!.height = chartHeight * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${chartHeight}px`

      const ctx = canvas!.getContext('2d')
      if (!ctx) return
      ctx.direction = 'ltr'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, chartHeight)

      if (!steps.length) {
        ctx.fillStyle = MUTED_INK
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, chartHeight / 2)
        return
      }

      const trackW = width - 24

      steps.forEach((step, i) => {
        const rowY = PAD_TOP + i * ROW_H
        const barY = rowY + 18
        const barW = Math.max(trackW * step.conversionFromStart, 6)
        const isHovered = hovered === i

        // برچسب مستقیم بالای میله: نام ایونت + تعداد
        ctx.fillStyle = PRIMARY_INK
        ctx.font = '600 12px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${i + 1}. ${step.eventName}`, 12, rowY + 8)
        ctx.textAlign = 'right'
        ctx.fillStyle = MUTED_INK
        ctx.font = '11px sans-serif'
        ctx.fillText(step.count.toLocaleString('fa-IR'), width - 12, rowY + 8)

        // track (سایه‌ی ۱۰۰٪ پشت میله) — چون تراک با opacity کم رسم می‌شود, هیچ متنی رویش سوار نیست
        drawRoundedBar(ctx, 12, barY, trackW, BAR_H, TRACK)

        // میله‌ی واقعی
        const color = colorForStep(i, steps.length)
        drawRoundedBar(ctx, 12, barY, barW, BAR_H, color, isHovered)

        // درصد داخل/بیرون میله — فقط اگر جا باشد (مطابق قاعده‌ی «label اگر جا نشد بیرون»)
        const pctText = `${Math.round(step.conversionFromStart * 100)}٪`
        ctx.font = '600 11px sans-serif'
        const textW = ctx.measureText(pctText).width
        if (barW > textW + 16) {
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'right'
          ctx.fillText(pctText, 12 + barW - 8, barY + BAR_H / 2 + 4)
        } else {
          ctx.fillStyle = PRIMARY_INK
          ctx.textAlign = 'left'
          ctx.fillText(pctText, 12 + barW + 6, barY + BAR_H / 2 + 4)
        }

        // رابط ریزش بین این مرحله و مرحله‌ی بعد
        if (i < steps.length - 1) {
          const next = steps[i + 1]
          const dropPct = Math.round((1 - next.conversionFromPrevious) * 100)
          const severe = dropPct >= 50
          const y = barY + BAR_H + 6

          ctx.fillStyle = severe ? CRITICAL : MUTED_INK
          ctx.font = severe ? '600 11px sans-serif' : '11px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`▾ ${dropPct}٪ ریزش`, 12, y + 10)
        }
      })
    }

    draw()
    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [steps, chartHeight, hovered])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const index = Math.floor((y - PAD_TOP) / ROW_H)
    setHovered(index >= 0 && index < steps.length ? index : null)
    setMouse({ x: e.clientX - rect.left, y })
  }

  const hoveredStep = hovered !== null ? steps[hovered] : null

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <canvas ref={canvasRef} style={{ height: chartHeight }} />
      {hoveredStep && mouse && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(mouse.x + 12, (containerRef.current?.clientWidth ?? 300) - 180),
            top: Math.max(mouse.y - 8, 0),
            background: '#0b0b0bdd',
            color: '#fff',
            padding: '8px 10px',
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>{hoveredStep.count.toLocaleString('fa-IR')} کاربر</div>
          <div style={{ opacity: 0.8 }}>{hoveredStep.eventName}</div>
          <div style={{ opacity: 0.8 }}>
            {Math.round(hoveredStep.conversionFromStart * 100)}٪ از ابتدا ·{' '}
            {Math.round(hoveredStep.conversionFromPrevious * 100)}٪ از مرحله‌ی قبل
          </div>
        </div>
      )}
    </div>
  )
}

function drawRoundedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lifted = false,
) {
  const r = Math.min(4, w / 2, h / 2)
  ctx.save()
  if (lifted) {
    ctx.shadowColor = 'rgba(11,11,11,0.25)'
    ctx.shadowBlur = 6
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
