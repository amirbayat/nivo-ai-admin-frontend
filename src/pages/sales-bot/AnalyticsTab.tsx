import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Card, Col, DatePicker, Row, Spin, Statistic } from 'antd'
import { ApiOutlined, DollarOutlined, MessageOutlined, PhoneOutlined, TagOutlined } from '@ant-design/icons'
import { useSalesBotAnalyticsOverview, useSalesBotAnalyticsTimeseries } from '@/queries/sales-bot.queries'
import type { SalesBotAnalyticsPoint } from '@/types/api'

const { RangePicker } = DatePicker

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

function pct(v: number | null): string {
  if (v === null) return '—'
  return `${(v * 100).toFixed(1)}٪`
}

function TrendChart({ data }: { data: SalesBotAnalyticsPoint[] }) {
  if (!data.length) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>داده‌ای نیست</div>

  const W = 760, H = 220, PAD = { top: 20, right: 20, bottom: 30, left: 60 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const maxTokens = Math.max(...data.map((d) => d.tokens), 1)
  const maxCost = Math.max(...data.map((d) => d.costToman), 1)

  const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW
  const yTokens = (v: number) => PAD.top + plotH - (v / maxTokens) * plotH
  const yCost = (v: number) => PAD.top + plotH - (v / maxCost) * plotH

  const tokensPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yTokens(d.tokens).toFixed(1)}`).join(' ')
  const costPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yCost(d.costToman).toFixed(1)}`).join(' ')
  const step = Math.ceil(data.length / 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', direction: 'ltr' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD.left} y1={PAD.top + plotH * (1 - t)} x2={W - PAD.right} y2={PAD.top + plotH * (1 - t)} stroke="#333" strokeDasharray="3,3" />
      ))}
      <path d={tokensPath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      <path d={costPath} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5,3" />
      {data.map((d, i) => (i % step === 0 ? (
        <text key={i} x={x(i)} y={H - 8} fontSize={9} fill="#888" textAnchor="middle">{d.date.slice(5)}</text>
      ) : null))}
      <line x1={W - 160} y1={15} x2={W - 140} y2={15} stroke="#0EA5E9" strokeWidth={2} />
      <text x={W - 135} y={19} fontSize={10} fill="#0EA5E9">توکن</text>
      <line x1={W - 160} y1={30} x2={W - 140} y2={30} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5,3" />
      <text x={W - 135} y={34} fontSize={10} fill="#F59E0B">هزینه (تومان)</text>
    </svg>
  )
}

export function AnalyticsTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])
  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: overview, isLoading } = useSalesBotAnalyticsOverview(from, to)
  const { data: timeseries } = useSalesBotAnalyticsTimeseries(from, to)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} allowClear={false} />
      </div>

      {isLoading || !overview ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="کل پیام‌ها" value={overview.totalMessages} prefix={<MessageOutlined style={{ marginLeft: 6 }} />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="کل توکن (ورودی/خروجی)" value={overview.totalTokens} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="هزینه" value={toman(overview.costToman)} suffix="تومان" prefix={<DollarOutlined style={{ marginLeft: 6 }} />} />
              <span style={{ fontSize: 12, color: '#888' }}>${overview.costUsd.toFixed(2)}</span>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="سشن‌های شروع‌شده" value={overview.sessionsStarted} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="پیشنهاد تخفیف نمایش‌داده‌شده" value={overview.discountOffersShown} prefix={<TagOutlined style={{ marginLeft: 6 }} />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="شماره گرفته‌شده" value={overview.phonesCaptured} prefix={<PhoneOutlined style={{ marginLeft: 6 }} />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="نرخ تبدیل پیشنهاد تخفیف" value={pct(overview.discountConversionRate)} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="هزینه‌ی embedding" value={toman(overview.embeddingCostToman)} suffix="تومان" prefix={<ApiOutlined style={{ marginLeft: 6 }} />} />
              <span style={{ fontSize: 12, color: '#888' }}>${overview.embeddingCostUsd.toFixed(4)}</span>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title="تعداد فراخوانی embedding" value={overview.embeddingCalls} /></Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginTop: 16 }} title="روند مصرف">
        {timeseries ? <TrendChart data={timeseries} /> : <Spin />}
      </Card>
    </div>
  )
}
