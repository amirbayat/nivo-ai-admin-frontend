import { useEffect, useRef, useState } from 'react'
import { Table } from 'antd'
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

const SEG_H = 64
const PAD_TOP = 10
const PAD_BOTTOM = 10
const LABEL_GAP = 20
const MIN_FUNNEL_W = 60

export function FunnelCanvasChart({ steps }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const chartHeight = Math.max(steps.length * SEG_H + PAD_TOP + PAD_BOTTOM, 160)

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

      // بدنه‌ی فانل یک شکل واحد و پیوسته است (بدون فاصله بین مرحله‌ها) که از عرض کامل در
      // مرحله‌ی اول به‌تدریج باریک می‌شود — سیلوئت کلاسیک «funnel»، نه چند میله‌ی جدا.
      // عرض هر مرحله متناسب با conversionFromStart همان مرحله است؛ لیبل‌ها کنار بدنه (نه
      // رویش) قرار می‌گیرند چون مرحله‌های پایانی معمولاً برای جا شدن متن داخلش باریک‌اند.
      const centerX = width / 2
      const maxFunnelW = Math.min(width * 0.34, 220)
      const funnelW = Math.max(maxFunnelW, MIN_FUNNEL_W)
      const labelX = Math.min(centerX + funnelW / 2 + LABEL_GAP, width - 140)
      const labelMaxW = Math.max(width - labelX - 12, 80)

      steps.forEach((step, i) => {
        const segY = PAD_TOP + i * SEG_H
        const topW = Math.max(funnelW * step.conversionFromStart, 4)
        const nextConv = i < steps.length - 1 ? steps[i + 1].conversionFromStart : step.conversionFromStart
        const bottomW = Math.max(funnelW * nextConv, 4)
        const isHovered = hovered === i
        const midY = segY + SEG_H / 2

        const color = colorForStep(i, steps.length)
        drawTrapezoid(ctx, centerX, segY, topW, bottomW, SEG_H, color, isHovered)

        // درصد از ابتدا، سوار روی بدنه — فقط اگر جا باشد
        const pctText = `${Math.round(step.conversionFromStart * 100)}٪`
        ctx.font = '700 12px sans-serif'
        const pctW = ctx.measureText(pctText).width
        if (Math.min(topW, bottomW) > pctW + 12 && SEG_H > 24) {
          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.fillText(pctText, centerX, midY + 4)
        }

        // خط راهنما از لبه‌ی بدنه تا شروع لیبل کناری
        const edgeX = centerX + Math.max(topW, bottomW) / 2
        ctx.strokeStyle = TRACK
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(edgeX, midY)
        ctx.lineTo(labelX, midY)
        ctx.stroke()

        // لیبل کناری: نام + تعداد، و اگر ریزشی داشته باشد زیرش با رنگ متناسب با شدت
        ctx.textAlign = 'left'
        ctx.fillStyle = PRIMARY_INK
        ctx.font = '600 12px sans-serif'
        const nameLine = truncateToWidth(ctx, `${i + 1}. ${step.eventName}`, labelMaxW)
        ctx.fillText(nameLine, labelX, midY - 10)

        ctx.fillStyle = MUTED_INK
        ctx.font = '11px sans-serif'
        ctx.fillText(`${step.count.toLocaleString('fa-IR')} کاربر`, labelX, midY + 6)

        if (i > 0) {
          const dropPct = Math.round((1 - step.conversionFromPrevious) * 100)
          const severe = dropPct >= 50
          ctx.fillStyle = severe ? CRITICAL : MUTED_INK
          ctx.font = severe ? '600 10px sans-serif' : '10px sans-serif'
          ctx.fillText(`▾ ${dropPct}٪ ریزش از مرحله‌ی قبل`, labelX, midY + 20)
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
    const index = Math.floor((y - PAD_TOP) / SEG_H)
    setHovered(index >= 0 && index < steps.length ? index : null)
    setMouse({ x: e.clientX - rect.left, y })
  }

  const hoveredStep = hovered !== null ? steps[hovered] : null

  // hero numbers: نرخ تبدیل کل + بدترین ریزش — طبق قاعده‌ی marks-and-anatomy («عدد قهرمان»
  // برای پرسش اول ذهن بیننده: از هر ۱۰۰ نفر که شروع کردن چند نفر رسیدن به آخر؟ کجا بیشترین‌ ریزش رو داشتیم؟)
  const overallConversion =
    steps.length > 1 && steps[0].count > 0 ? steps[steps.length - 1].count / steps[0].count : null
  const drops = steps.slice(1).map((step, idx) => ({
    fromStep: steps[idx],
    toStep: step,
    dropPct: 1 - step.conversionFromPrevious,
  }))
  const worstDrop = drops.length ? drops.reduce((a, b) => (b.dropPct > a.dropPct ? b : a)) : null

  return (
    <div>
      {steps.length > 0 && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
          {overallConversion !== null && (
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: PRIMARY_INK, lineHeight: 1.2 }}>
                {Math.round(overallConversion * 100)}٪
              </div>
              <div style={{ fontSize: 12, color: MUTED_INK }}>
                نرخ تبدیل کل — «{steps[0].eventName}» تا «{steps[steps.length - 1].eventName}»
              </div>
            </div>
          )}
          {worstDrop && (
            <div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: worstDrop.dropPct >= 0.5 ? CRITICAL : PRIMARY_INK,
                }}
              >
                {Math.round(worstDrop.dropPct * 100)}٪
              </div>
              <div style={{ fontSize: 12, color: MUTED_INK }}>
                بیشترین ریزش — بین «{worstDrop.fromStep.eventName}» و «{worstDrop.toStep.eventName}»
              </div>
            </div>
          )}
        </div>
      )}
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
      {/* نمای جدولی همان داده — طبق قاعده‌ی دسترسی‌پذیری dataviz: هر چیزی که نمودار با هاور
          نشون می‌ده باید بدون هاور هم (برای صفحه‌خوان/کپی‌کردن/چاپ) در دسترس باشه */}
      <Table
        rowKey="eventName"
        size="small"
        pagination={false}
        style={{ marginTop: 16 }}
        dataSource={steps}
        columns={[
          { title: '#', render: (_: unknown, __: FunnelStepResult, i: number) => i + 1, width: 40 },
          { title: 'ایونت', dataIndex: 'eventName' },
          { title: 'تعداد', dataIndex: 'count', render: (v: number) => v.toLocaleString('fa-IR') },
          {
            title: '٪ از ابتدا',
            dataIndex: 'conversionFromStart',
            render: (v: number) => `${Math.round(v * 100)}٪`,
          },
          {
            title: '٪ از مرحله‌ی قبل',
            dataIndex: 'conversionFromPrevious',
            render: (v: number) => `${Math.round(v * 100)}٪`,
          },
        ]}
      />
    </div>
  )
}

// یک بخش از بدنه‌ی فانل: ذوزنقه‌ای که از عرض topW در بالا به bottomW در پایین می‌رسد،
// حول centerX متقارن — پشت‌سرهم چیدن این‌ها (بدون فاصله) سیلوئت پیوسته‌ی «فانل» را می‌سازد
function drawTrapezoid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  topW: number,
  bottomW: number,
  h: number,
  color: string,
  lifted = false,
) {
  ctx.save()
  if (lifted) {
    ctx.shadowColor = 'rgba(11,11,11,0.25)'
    ctx.shadowBlur = 8
  }
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(centerX - topW / 2, y)
  ctx.lineTo(centerX + topW / 2, y)
  ctx.lineTo(centerX + bottomW / 2, y + h)
  ctx.lineTo(centerX - bottomW / 2, y + h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return `${truncated}…`
}
