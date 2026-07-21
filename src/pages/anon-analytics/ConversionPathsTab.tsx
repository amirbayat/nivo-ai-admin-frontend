import { useMemo, useState } from 'react'
import { Card, Col, Row, Select, Space, Spin, Tag, Typography, Empty } from 'antd'
import { useAnonAnalyticsCampaigns, useAnonAnalyticsConversionPaths } from '@/queries/anon-analytics.queries'
import { FunnelCanvasChart } from './FunnelCanvasChart'

const { Text, Paragraph } = Typography

interface Props {
  from: string
  to: string
}

// چهار مسیر محتمل تبدیل: زودهنگام (بدون برخورد به محدودیت) / ناحیه‌ی محدود / اجباری (بعد از
// مسدود شدن) / مسدود و از دست رفته. فانل «کلی» (تب فانل) همه‌ی این‌ها را روی هم می‌ریزد؛
// این تب نشان می‌دهد دقیقاً کدام مسیر واقعاً کاربران را تبدیل می‌کند.
export function ConversionPathsTab({ from, to }: Props) {
  const [utmSource, setUtmSource] = useState<string | undefined>(undefined)
  const [utmCampaign, setUtmCampaign] = useState<string | undefined>(undefined)

  const { data: campaigns } = useAnonAnalyticsCampaigns(from, to)
  const { data: segments, isLoading } = useAnonAnalyticsConversionPaths(from, to, utmSource, utmCampaign)

  const utmSourceOptions = useMemo(() => {
    const set = new Set((campaigns ?? []).map((c) => c.utmSource).filter((v): v is string => Boolean(v)))
    return Array.from(set).map((v) => ({ label: v, value: v }))
  }, [campaigns])

  const utmCampaignOptions = useMemo(() => {
    const set = new Set(
      (campaigns ?? [])
        .filter((c) => !utmSource || c.utmSource === utmSource)
        .map((c) => c.utmCampaign)
        .filter((v): v is string => Boolean(v)),
    )
    return Array.from(set).map((v) => ({ label: v, value: v }))
  }, [campaigns, utmSource])

  const totalConverted = (segments ?? [])
    .filter((s) => s.key !== 'blockedLost')
    .reduce((sum, s) => sum + s.sessionCount, 0)

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="فیلتر منبع UTM"
          style={{ width: 160 }}
          options={utmSourceOptions}
          value={utmSource}
          onChange={(v) => { setUtmSource(v); setUtmCampaign(undefined) }}
        />
        <Select
          allowClear
          placeholder="فیلتر کمپین UTM"
          style={{ width: 160 }}
          options={utmCampaignOptions}
          value={utmCampaign}
          onChange={setUtmCampaign}
        />
      </Space>

      {isLoading || !segments ? (
        <Spin />
      ) : segments.every((s) => s.sessionCount === 0) ? (
        <Empty description="داده‌ای برای این بازه/فیلتر یافت نشد" />
      ) : (
        <Row gutter={[16, 16]}>
          {segments.map((segment) => {
            const share =
              segment.key !== 'blockedLost' && totalConverted > 0
                ? `${((segment.sessionCount / totalConverted) * 100).toFixed(0)}٪ از کل ثبت‌نام‌ها`
                : null
            return (
              <Col xs={24} lg={12} key={segment.key}>
                <Card
                  title={segment.label}
                  extra={<Tag color={segment.key === 'blockedLost' ? 'red' : 'green'}>{segment.sessionCount.toLocaleString('fa-IR')} نشست</Tag>}
                >
                  <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                    {segment.description}
                  </Paragraph>
                  {share && <Text style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{share}</Text>}
                  {segment.sessionCount === 0 ? (
                    <Empty description="در این بازه/فیلتر رخ نداده" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <FunnelCanvasChart data={segment.stages} />
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
