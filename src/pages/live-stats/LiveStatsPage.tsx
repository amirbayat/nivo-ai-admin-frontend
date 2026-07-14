import { useState } from 'react'
import { Card, Col, Row, Statistic, Segmented, Typography, Spin } from 'antd'
import {
  ThunderboltOutlined, ApiOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useLiveStatsSummary, useLiveStatsTimeseries, useDailyPeaks } from '@/queries/live-stats.queries'
import { LiveRequestsCanvasChart } from './LiveRequestsCanvasChart'
import { DailyPeaksCanvasChart } from './DailyPeaksCanvasChart'

const { Title, Text } = Typography

const RANGE_OPTIONS = [
  { label: '۳۰ دقیقه', value: 30 },
  { label: '۱ ساعت', value: 60 },
  { label: '۳ ساعت', value: 180 },
  { label: '۶ ساعت', value: 360 },
]

const TYPE_LABELS = {
  chat: 'پاسخ چت',
  title: 'عنوان‌سازی',
  summary: 'خلاصه‌سازی',
  routing: 'مسیریابی مدل',
} as const

const PEAK_RANGE_OPTIONS = [
  { label: '۷ روز', value: 7 },
  { label: '۱۴ روز', value: 14 },
  { label: '۳۰ روز', value: 30 },
  { label: '۹۰ روز', value: 90 },
]

export function LiveStatsPage() {
  const [minutes, setMinutes] = useState(60)
  const [peakDays, setPeakDays] = useState(14)
  const { data: summary } = useLiveStatsSummary()
  const { data: timeseries, isLoading } = useLiveStatsTimeseries(minutes)
  const { data: dailyPeaks, isLoading: peaksLoading } = useDailyPeaks(peakDays)

  const today = summary?.today
  const successRate = today && today.total > 0 ? Math.round((today.success / today.total) * 100) : null
  const rateColor = successRate === null ? undefined : successRate >= 95 ? '#10b981' : successRate >= 80 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>وضعیت زنده</Title>
      <Text type="secondary">همین الان روی سرور چه خبره — خودکار به‌روز می‌شود، نیازی به رفرش نیست</Text>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="در حال چت کردن، همین الان"
              value={summary?.activeStreams ?? 0}
              suffix="نفر"
              prefix={<ThunderboltOutlined style={{ color: '#10b981', marginLeft: 8 }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="درخواست‌های امروز به Liara"
              value={today?.total ?? 0}
              prefix={<ApiOutlined style={{ marginLeft: 8 }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="نرخ موفقیت امروز"
              value={successRate ?? 0}
              suffix="٪"
              prefix={<CheckCircleOutlined style={{ color: rateColor, marginLeft: 8 }} />}
              valueStyle={{ color: rateColor }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="میانگین تأخیر پاسخ چت (امروز)"
              value={today?.avgLatencyMsByType.chat ?? 0}
              suffix="ms"
              prefix={<ClockCircleOutlined style={{ marginLeft: 8 }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        title="درخواست‌ها به Liara (موفق/ناموفق، به‌ازای دقیقه)"
        extra={
          <Segmented
            options={RANGE_OPTIONS}
            value={minutes}
            onChange={(v) => setMinutes(v as number)}
          />
        }
      >
        {isLoading ? <Spin /> : <LiveRequestsCanvasChart data={timeseries ?? []} />}
      </Card>

      <Card
        style={{ marginTop: 16 }}
        title="پیک مصرف روزانه (حداکثر کاربران هم‌زمان)"
        extra={
          <Segmented
            options={PEAK_RANGE_OPTIONS}
            value={peakDays}
            onChange={(v) => setPeakDays(v as number)}
          />
        }
      >
        {peaksLoading ? <Spin /> : <DailyPeaksCanvasChart data={dailyPeaks ?? []} />}
      </Card>

      <Card style={{ marginTop: 16 }} title="تفکیک بر اساس نوع (امروز)">
        <Row gutter={[16, 16]}>
          {(Object.keys(TYPE_LABELS) as (keyof typeof TYPE_LABELS)[]).map((key) => (
            <Col span={6} key={key}>
              <Statistic
                title={TYPE_LABELS[key]}
                value={today?.byType[key] ?? 0}
                suffix={
                  today?.avgLatencyMsByType[key]
                    ? `(میانگین ${today.avgLatencyMsByType[key]}ms)`
                    : undefined
                }
                valueStyle={{ fontSize: 20 }}
              />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
