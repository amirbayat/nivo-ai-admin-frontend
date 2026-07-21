import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker, Space, Tabs, Typography } from 'antd'
import { OverviewTab } from './OverviewTab'
import { FunnelTab } from './FunnelTab'
import { ConversionPathsTab } from './ConversionPathsTab'
import { CampaignsTab } from './CampaignsTab'
import { ConversionQualityTab } from './ConversionQualityTab'

const { RangePicker } = DatePicker
const { Title } = Typography

export function AnonAnalyticsPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])

  const from = range[0].startOf('day').toISOString()
  const to = range[1].endOf('day').toISOString()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>آنالیز چت بدون لاگین</Title>
        <Space wrap>
          <RangePicker
            value={range}
            onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])}
            allowClear={false}
          />
        </Space>
      </div>

      <Tabs
        defaultActiveKey="overview"
        items={[
          { key: 'overview', label: 'کلی', children: <OverviewTab from={from} to={to} /> },
          { key: 'funnel', label: 'فانل', children: <FunnelTab from={from} to={to} /> },
          { key: 'conversion-paths', label: 'مسیرهای تبدیل', children: <ConversionPathsTab from={from} to={to} /> },
          { key: 'campaigns', label: 'کمپین‌ها', children: <CampaignsTab from={from} to={to} /> },
          { key: 'conversion-quality', label: 'کیفیت تبدیل', children: <ConversionQualityTab from={from} to={to} /> },
        ]}
      />
    </div>
  )
}
