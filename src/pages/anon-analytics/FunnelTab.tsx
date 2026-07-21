import { useMemo, useState } from 'react'
import { Card, Space, Select, Spin } from 'antd'
import { useAnonAnalyticsCampaigns, useAnonAnalyticsFunnel } from '@/queries/anon-analytics.queries'
import { FunnelCanvasChart } from './FunnelCanvasChart'

interface Props {
  from: string
  to: string
}

export function FunnelTab({ from, to }: Props) {
  const [utmSource, setUtmSource] = useState<string | undefined>(undefined)
  const [utmCampaign, setUtmCampaign] = useState<string | undefined>(undefined)

  const { data: campaigns } = useAnonAnalyticsCampaigns(from, to)
  const { data: funnel, isLoading } = useAnonAnalyticsFunnel(from, to, utmSource, utmCampaign)

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

  return (
    <Card
      title="فانل تبدیل بازاریابی"
      extra={
        <Space wrap>
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
      }
    >
      {isLoading || !funnel ? <Spin /> : <FunnelCanvasChart data={funnel} />}
    </Card>
  )
}
