import { useEffect, useRef, useState } from 'react'

interface FlowTarget {
  nextEvent: string
  count: number
}

interface Props {
  source: string
  targets: FlowTarget[]
}

// ترتیب ثابت hue های categorical — CVD-safe (validated: scripts/validate_palette.js
// "#2a78d6,#008300,#e87ba4,#eda100,#1baf7a,#eb6834" --mode light). بعد از ۶ تا، بقیه
// زیر «سایر» (خاکستری) جمع می‌شوند — طبق قاعده‌ی dataviz skill برای اشباع رنگ categorical
const CATEGORICAL = ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834']
const OTHER_COLOR = '#c3c2b7'
const PRIMARY_INK = '#0b0b0b'
const MUTED_INK = '#898781'
const MAX_DIRECT = 6

const NODE_W = 10
const LABEL_W = 190
const TITLE_H = 26
const NOMINAL_H = 220
const MIN_ROW_H = 18
const TWO_LINE_THRESHOLD = 30

export function FlowCanvasChart({ source, targets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)

  const top = targets.slice(0, MAX_DIRECT)
  const rest = targets.slice(MAX_DIRECT)
  const restCount = rest.reduce((sum, t) => sum + t.count, 0)
  const nodes = restCount > 0 ? [...top, { nextEvent: 'سایر', count: restCount }] : top
  const total = nodes.reduce((sum, n) => sum + n.count, 0) || 1

  // ارتفاع هر ردیف از یک بودجه‌ی اسمی متناسب با سهم می‌آید، با یک کف حداقلی — و
  // ارتفاع کل چارت از مجموع همین‌ها ساخته می‌شود (نه برعکس) تا هیچ‌وقت overflow نشود،
  // حتی وقتی چند دسته‌ی خیلی کوچک هم‌زمان به کف حداقلی می‌خورند
  const rowHeights = nodes.map((n) => Math.max((n.count / total) * NOMINAL_H, MIN_ROW_H))
  const flowAreaH = rowHeights.reduce((a, b) => a + b, 0) || 140
  const chartHeight = TITLE_H + flowAreaH + 10
  const nodeRectsRef = useRef<{ y: number; h: number }[]>([])

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

      if (!nodes.length) {
        ctx.fillStyle = MUTED_INK
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('داده‌ای برای نمایش وجود ندارد', width / 2, chartHeight / 2)
        return
      }

      // در dir=rtl سایت، این کانواس عمداً چپ‌به‌راست می‌ماند (مثل بقیه‌ی canvas چارت‌های
      // پروژه) — منبع سمت چپ، مقصدها سمت راست، عرض هر باند متناسب با سهم آن مقصد است
      ctx.textAlign = 'left'
      ctx.font = '600 12px sans-serif'
      ctx.fillStyle = PRIMARY_INK
      ctx.fillText(`بعد از «${truncate(ctx, source, 260)}»`, 0, 14)
      ctx.font = '10px sans-serif'
      ctx.fillStyle = MUTED_INK
      ctx.fillText(`${total.toLocaleString('fa-IR')} رخداد`, 0, 26)

      const flowTop = TITLE_H
      const sourceX = 0
      const rightEdge = width - LABEL_W
      const midX = sourceX + NODE_W + (rightEdge - sourceX - NODE_W) * 0.5

      // منبع فقط یک «چیز واحد» است، مقصدها چندتا — پس ستون منبع عمداً کوچک و وسط‌چین
      // می‌ماند و مقصدها روی کل ارتفاع پخش می‌شوند؛ همین عدم‌تقارن است که باعث می‌شود
      // ریبون‌ها واقعاً «باز» و منحنی به‌نظر برسند، نه یک ردیف مستطیل صاف
      const sourceRegionH = Math.min(flowAreaH * 0.5, 90)
      const sourceRegionTop = flowTop + (flowAreaH - sourceRegionH) / 2

      ctx.fillStyle = '#1c1c1b'
      roundRect(ctx, sourceX, sourceRegionTop, NODE_W, sourceRegionH, 3)
      ctx.fill()

      let srcCursor = sourceRegionTop
      let dstCursor = flowTop
      const rects: { y: number; h: number }[] = []

      nodes.forEach((node, i) => {
        const share = node.count / total
        const srcH = share * sourceRegionH
        const dstH = rowHeights[i]
        const color = i < top.length ? CATEGORICAL[i] : OTHER_COLOR
        const isHovered = hovered === i

        const srcY0 = srcCursor
        const srcY1 = srcCursor + srcH
        const dstY0 = dstCursor
        const dstY1 = dstCursor + dstH

        ctx.beginPath()
        ctx.moveTo(sourceX + NODE_W, srcY0)
        ctx.bezierCurveTo(midX, srcY0, midX, dstY0, rightEdge, dstY0)
        ctx.lineTo(rightEdge, dstY1)
        ctx.bezierCurveTo(midX, dstY1, midX, srcY1, sourceX + NODE_W, srcY1)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.globalAlpha = isHovered ? 0.55 : 0.28
        ctx.fill()
        ctx.globalAlpha = 1

        // گره‌ی مقصد (سواچ رنگی) — ۲px surface gap بالا/پایین بین سواچ‌های چسبیده
        ctx.fillStyle = color
        roundRect(ctx, rightEdge, dstY0 + 1, NODE_W, Math.max(dstH - 2, 4), 3)
        ctx.fill()

        // برچسب مستقیم: فقط اگر جا باشد — طبق قاعده‌ی dataviz skill (هیچ‌وقت overflow/clip
        // نشود). ردیف‌های خیلی کوچک فقط یک خط (اسم) می‌گیرند، مقدار دقیق به tooltip می‌رود
        const pct = Math.round(share * 100)
        ctx.fillStyle = PRIMARY_INK
        ctx.font = isHovered ? '700 12px sans-serif' : '600 12px sans-serif'
        ctx.textAlign = 'left'
        const nameLabel = truncate(ctx, node.nextEvent, LABEL_W - 24)
        if (dstH >= TWO_LINE_THRESHOLD) {
          ctx.fillText(nameLabel, rightEdge + 16, dstY0 + dstH / 2 - 2)
          ctx.fillStyle = MUTED_INK
          ctx.font = '10px sans-serif'
          ctx.fillText(`${node.count.toLocaleString('fa-IR')} (${pct}٪)`, rightEdge + 16, dstY0 + dstH / 2 + 12)
        } else {
          ctx.fillText(nameLabel, rightEdge + 16, dstY0 + dstH / 2 + 4)
        }

        rects.push({ y: dstY0, h: dstH })
        srcCursor += srcH
        dstCursor += dstH
      })
      nodeRectsRef.current = rects
    }

    draw()
    const resizeObserver = new ResizeObserver(draw)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [nodes, rowHeights, source, total, chartHeight, flowAreaH, hovered, top.length])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const idx = nodeRectsRef.current.findIndex((r) => y >= r.y && y <= r.y + r.h)
    setHovered(idx === -1 ? null : idx)
    setMouse({ x: e.clientX - rect.left, y })
  }

  const hoveredNode = hovered !== null ? nodes[hovered] : null

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <canvas ref={canvasRef} style={{ height: chartHeight, cursor: 'default' }} />
      {hoveredNode && mouse && (
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
          <div style={{ fontWeight: 700 }}>{hoveredNode.nextEvent}</div>
          <div style={{ opacity: 0.8 }}>
            {hoveredNode.count.toLocaleString('fa-IR')} رخداد ·{' '}
            {Math.round((hoveredNode.count / total) * 100)}٪
          </div>
        </div>
      )}
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1)
  }
  return `${t}…`
}
