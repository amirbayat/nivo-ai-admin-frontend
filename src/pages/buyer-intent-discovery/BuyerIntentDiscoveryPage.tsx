import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Button, Card, DatePicker, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useBuyerIntentDiscovery } from '@/queries/buyer-intent-discovery.queries'
import type { BuyerNeedCount, LowConfidenceItem, UnmatchedBuyerNeedItem } from '@/types/api'
import { fa } from '@/locales/fa'
import { ConversationTraceDrawer } from '@/pages/sales-agent-quality/ConversationTraceDrawer'

const { Title } = Typography
const { RangePicker } = DatePicker

function tagLabel(tag: string): string {
  return fa.buyerIntentDiscovery.tagLabels[tag] ?? tag
}

// docs/PRD-buyer-purchase-intent-taxonomy.md بخش ۵ — صفحه‌ی مستقل، جدا از sales-agent-quality
// (که برای UNCLEAR سطح جریان مکالمه است، سطح متفاوتی از این فیچر)
export function BuyerIntentDiscoveryPage() {
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)
  const [traceConversationId, setTraceConversationId] = useState<string | null>(null)

  const { data, isLoading } = useBuyerIntentDiscovery({
    storeId: storeFilter,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })

  // همان الگوی SalesAgentQualityPage — چون endpoint مستقل لیست فروشگاه‌ها وجود ندارد، گزینه‌های
  // فیلتر از خودِ داده‌ی برگشتی (بخش unmatched) استخراج می‌شوند
  const storeOptions = useMemo(() => {
    const names = new Set(
      [...(data?.unmatched ?? []), ...(data?.lowConfidence ?? [])].map((i) => i.storeName).filter(Boolean),
    )
    return Array.from(names).map((name) => ({ value: name, label: name }))
  }, [data])

  const needColumns: ColumnsType<BuyerNeedCount> = [
    {
      title: fa.buyerIntentDiscovery.tagColumn,
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: string) => tagLabel(tag),
    },
    {
      title: fa.buyerIntentDiscovery.countColumn,
      dataIndex: 'count',
      key: 'count',
      width: 120,
      sorter: (a, b) => a.count - b.count,
      defaultSortOrder: 'descend',
    },
  ]

  const unmatchedColumns: ColumnsType<UnmatchedBuyerNeedItem> = [
    {
      title: fa.buyerIntentDiscovery.labelColumn,
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: fa.buyerIntentDiscovery.sampleMessageColumn,
      dataIndex: 'sampleMessage',
      key: 'sampleMessage',
      ellipsis: true,
    },
    {
      title: fa.salesAgentQuality.store,
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
    },
    {
      title: fa.buyerIntentDiscovery.countColumn,
      dataIndex: 'count',
      key: 'count',
      width: 100,
    },
    {
      title: fa.buyerIntentDiscovery.lastSeenColumn,
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_: unknown, item: UnmatchedBuyerNeedItem) => (
        <Button size="small" onClick={() => setTraceConversationId(item.conversationId)}>
          {fa.buyerIntentDiscovery.viewConversation}
        </Button>
      ),
    },
  ]

  const lowConfidenceColumns: ColumnsType<LowConfidenceItem> = [
    {
      title: fa.buyerIntentDiscovery.sampleMessageColumn,
      dataIndex: 'sampleMessage',
      key: 'sampleMessage',
      ellipsis: true,
    },
    {
      title: fa.buyerIntentDiscovery.intentColumn,
      dataIndex: 'intent',
      key: 'intent',
      width: 140,
    },
    {
      title: fa.buyerIntentDiscovery.confidenceColumn,
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (v: 'MEDIUM' | 'LOW') => fa.buyerIntentDiscovery.confidenceLabels[v] ?? v,
    },
    {
      title: fa.salesAgentQuality.store,
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
    },
    {
      title: fa.buyerIntentDiscovery.dateColumn,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_: unknown, item: LowConfidenceItem) => (
        <Button size="small" onClick={() => setTraceConversationId(item.conversationId)}>
          {fa.buyerIntentDiscovery.viewConversation}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.buyerIntentDiscovery.title}
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={fa.buyerIntentDiscovery.filterStore}
          style={{ width: 200 }}
          value={storeFilter}
          onChange={setStoreFilter}
          options={storeOptions}
        />
        <RangePicker value={range} onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)} />
      </Space>

      <Card title={fa.buyerIntentDiscovery.needsTableTitle} style={{ marginBottom: 24 }}>
        <Table<BuyerNeedCount>
          rowKey="tag"
          dataSource={data?.buyerNeedCounts ?? []}
          columns={needColumns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={false}
        />
      </Card>

      <Card title={fa.buyerIntentDiscovery.unmatchedTableTitle}>
        <Table<UnmatchedBuyerNeedItem>
          rowKey="label"
          dataSource={data?.unmatched ?? []}
          columns={unmatchedColumns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Card title={fa.buyerIntentDiscovery.lowConfidenceTableTitle} style={{ marginTop: 24 }}>
        <Table<LowConfidenceItem>
          rowKey="conversationId"
          dataSource={data?.lowConfidence ?? []}
          columns={lowConfidenceColumns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <ConversationTraceDrawer conversationId={traceConversationId} onClose={() => setTraceConversationId(null)} />
    </div>
  )
}
