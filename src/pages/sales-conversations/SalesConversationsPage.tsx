import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Button, Card, DatePicker, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSalesConversations } from '@/queries/sales-conversations.queries'
import { useQaStores } from '@/queries/sales-agent-qa.queries'
import type { SalesConversationListItem } from '@/types/api'
import { fa } from '@/locales/fa'
import { ConversationTraceDrawer } from '@/pages/sales-agent-quality/ConversationTraceDrawer'

const { Title } = Typography
const { RangePicker } = DatePicker

const STATE_OPTIONS = Object.entries(fa.salesConversations.stateLabels).map(([value, label]) => ({
  value,
  label,
}))

// فیدبک کاربر ۱۴۰۵/۰۷/۰۱ — برخلاف SalesAgentQualityPage (فقط پیام‌های نافهم، فیلتر فروشگاه
// derived از نتایج صفحه‌ی فعلی)، این صفحه لیست کامل همه‌ی مکالمات است با یک فیلتر فروشگاه
// واقعی (useQaStores، نه مشتق از داده‌ی همین صفحه). جزئیات کامل هر ردیف همان
// ConversationTraceDrawer موجود است — بدون تغییر در خودش.
export function SalesConversationsPage() {
  const [page, setPage] = useState(1)
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined)
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)
  const [traceConversationId, setTraceConversationId] = useState<string | null>(null)

  const { data: stores } = useQaStores()
  const { data, isLoading } = useSalesConversations({
    page,
    storeId: storeFilter,
    state: stateFilter,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })

  const columns: ColumnsType<SalesConversationListItem> = [
    {
      title: fa.salesConversations.store,
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
    },
    {
      title: fa.salesConversations.customer,
      key: 'customer',
      width: 160,
      render: (_: unknown, item) => item.customerName ?? item.customerPhone ?? fa.salesConversations.anonymousCustomer,
    },
    {
      title: fa.salesConversations.channel,
      dataIndex: 'channel',
      key: 'channel',
      width: 90,
      render: (v: string) => fa.salesAgentQuality.channelLabels[v] ?? v,
    },
    {
      title: fa.salesConversations.lastMessage,
      dataIndex: 'lastMessagePreview',
      key: 'lastMessagePreview',
      ellipsis: true,
    },
    {
      title: fa.salesConversations.state,
      dataIndex: 'currentState',
      key: 'currentState',
      width: 150,
      render: (v: string) => fa.salesConversations.stateLabels[v] ?? v,
    },
    {
      title: fa.salesConversations.failedTurns,
      dataIndex: 'failedTurnCount',
      key: 'failedTurnCount',
      width: 110,
      render: (v: number) => (v > 0 ? <Tag color="orange">{v}</Tag> : '—'),
    },
    {
      title: fa.salesConversations.handoff,
      dataIndex: 'endedInHandoff',
      key: 'endedInHandoff',
      width: 110,
      render: (v: boolean) => (v ? <Tag color="red">{fa.salesConversations.handoff}</Tag> : '—'),
    },
    {
      title: fa.salesConversations.date,
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_: unknown, item) => (
        <Button size="small" onClick={() => setTraceConversationId(item.id)}>
          {fa.salesConversations.viewTrace}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.salesConversations.title}
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          showSearch
          placeholder={fa.salesConversations.filterStore}
          style={{ width: 200 }}
          value={storeFilter}
          onChange={(v) => {
            setStoreFilter(v)
            setPage(1)
          }}
          options={(stores ?? []).map((s) => ({ value: s.id, label: s.name }))}
          optionFilterProp="label"
        />
        <Select
          allowClear
          placeholder={fa.salesConversations.filterState}
          style={{ width: 180 }}
          value={stateFilter}
          onChange={(v) => {
            setStateFilter(v)
            setPage(1)
          }}
          options={STATE_OPTIONS}
        />
        <RangePicker
          value={range}
          onChange={(v) => {
            setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
            setPage(1)
          }}
        />
      </Space>

      <Card>
        <Table<SalesConversationListItem>
          rowKey="id"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <ConversationTraceDrawer conversationId={traceConversationId} onClose={() => setTraceConversationId(null)} />
    </div>
  )
}
