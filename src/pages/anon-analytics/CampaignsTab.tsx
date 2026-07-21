import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAnonAnalyticsCampaigns } from '@/queries/anon-analytics.queries'
import type { AnonAnalyticsCampaignRow } from '@/types/api'

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}٪`
}

interface Props {
  from: string
  to: string
}

export function CampaignsTab({ from, to }: Props) {
  const { data: campaigns, isLoading } = useAnonAnalyticsCampaigns(from, to)

  const columns: ColumnsType<AnonAnalyticsCampaignRow> = [
    { title: 'منبع UTM', dataIndex: 'utmSource', key: 'utmSource', render: (v: string | null) => v ?? '—' },
    { title: 'کمپین UTM', dataIndex: 'utmCampaign', key: 'utmCampaign', render: (v: string | null) => v ?? '—' },
    { title: 'نشست', dataIndex: 'sessions', key: 'sessions', sorter: (a, b) => a.sessions - b.sessions },
    { title: 'پیام', dataIndex: 'messages', key: 'messages', sorter: (a, b) => a.messages - b.messages },
    { title: 'ثبت‌نام', dataIndex: 'signups', key: 'signups', sorter: (a, b) => a.signups - b.signups },
    { title: 'خرید', dataIndex: 'purchases', key: 'purchases', sorter: (a, b) => a.purchases - b.purchases },
    {
      title: 'درآمد (تومان)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (v: number) => toman(v),
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'نرخ تبدیل',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (v: number) => pct(v),
      sorter: (a, b) => a.conversionRate - b.conversionRate,
    },
  ]

  return (
    <Card title="عملکرد کمپین‌های تبلیغاتی — کدام تبلیغ بهتر جواب می‌دهد">
      <Table<AnonAnalyticsCampaignRow>
        rowKey={(r) => `${r.utmSource ?? 'none'}__${r.utmCampaign ?? 'none'}`}
        dataSource={campaigns ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'داده‌ای یافت نشد' }}
        pagination={false}
      />
    </Card>
  )
}
