import { Card, Col, Row, Spin, Statistic } from 'antd'
import { useAnonAnalyticsConversionQuality } from '@/queries/anon-analytics.queries'
import { HistogramCanvasChart } from './HistogramCanvasChart'

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

interface Props {
  from: string
  to: string
}

export function ConversionQualityTab({ from, to }: Props) {
  const { data, isLoading } = useAnonAnalyticsConversionQuality(from, to)

  if (isLoading || !data) return <Spin />

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="حجم نمونه" value={data.sampleSize} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="میانگین پیام قبل از خرید" value={data.avgMessagesBeforePurchase.toFixed(1)} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="میانگین روز تا خرید" value={data.avgDaysToPurchase.toFixed(1)} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="میانگین درآمد (تومان)" value={toman(data.avgRevenueToman)} /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="توزیع تعداد پیام قبل از خرید">
        <HistogramCanvasChart data={data.histogram} />
      </Card>
    </div>
  )
}
