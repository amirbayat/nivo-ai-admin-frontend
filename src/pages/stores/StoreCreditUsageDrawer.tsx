import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DatePicker, Drawer, Select, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useStoreCreditUsage } from '@/queries/store-credit.queries'
import type { CreditUsageEventItem } from '@/types/api'
import { fa } from '@/locales/fa'

const { RangePicker } = DatePicker

const KIND_OPTIONS = Object.entries(fa.stores.kindLabels)
  .filter(([value]) => value !== 'TOPUP')
  .map(([value, label]) => ({ value, label }))

// docs/PRD-admin-seller-credit-overview.md بخش ۳ — جزئیات خام CreditUsageEvent یک فروشگاه،
// همان الگوی ConversationTraceDrawer (باز/بسته با prop، فچ فقط وقتی باز است)
export function StoreCreditUsageDrawer(props: {
  storeId: string | null
  storeName: string
  onClose: () => void
}) {
  const { storeId, storeName, onClose } = props
  const [page, setPage] = useState(1)
  const [kind, setKind] = useState<string | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)

  const { data, isLoading } = useStoreCreditUsage({
    storeId,
    page,
    kind,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })

  const columns: ColumnsType<CreditUsageEventItem> = [
    {
      title: fa.stores.usageDrawer.date,
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: fa.stores.usageDrawer.kind,
      dataIndex: 'kind',
      width: 130,
      render: (v: string) => fa.stores.kindLabels[v] ?? v,
    },
    {
      title: fa.stores.usageDrawer.model,
      dataIndex: 'model',
      ellipsis: true,
    },
    {
      title: fa.stores.usageDrawer.cost,
      dataIndex: 'costToman',
      width: 110,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    {
      title: fa.stores.usageDrawer.quota,
      dataIndex: 'isFreeQuota',
      width: 90,
      render: (v: boolean) =>
        v ? (
          <Tag color="blue">{fa.stores.usageDrawer.freeQuota}</Tag>
        ) : (
          <Tag color="gold">{fa.stores.usageDrawer.paidQuota}</Tag>
        ),
    },
  ]

  return (
    <Drawer
      open={!!storeId}
      onClose={onClose}
      width={720}
      title={`${fa.stores.usageDrawer.titlePrefix} ${storeName}`}
    >
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={fa.stores.usageDrawer.filterKind}
          style={{ width: 180 }}
          value={kind}
          onChange={(v) => {
            setKind(v)
            setPage(1)
          }}
          options={KIND_OPTIONS}
        />
        <RangePicker
          value={range}
          onChange={(v) => {
            setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
            setPage(1)
          }}
        />
      </Space>

      <Table<CreditUsageEventItem>
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        locale={{ emptyText: fa.common.noData }}
        pagination={{
          current: page,
          pageSize: data?.pageSize ?? 30,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </Drawer>
  )
}
