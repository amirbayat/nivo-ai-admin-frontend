import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAbStats, useFailedMessages } from '@/queries/sales-agent-quality.queries'
import type { AbModelStat, FailedMessageItem } from '@/types/api'
import { fa } from '@/locales/fa'
import { ConversationTraceDrawer } from './ConversationTraceDrawer'

const { Title } = Typography
const { RangePicker } = DatePicker

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}٪`
}

// docs/PRD-sales-agent-admin-analytics.md بخش ۴ — groupBy=channel یعنی group مقدار enum
// CustomerChannel است ('WEB'/'TELEGRAM')، نه اسم مدل — برچسب فارسی جداگانه دارد
function groupLabel(groupBy: 'variant' | 'channel', group: string): string {
  return groupBy === 'channel' ? (fa.salesAgentQuality.channelLabels[group] ?? group) : group
}

function AbStatCard({ stat, groupBy }: { stat: AbModelStat; groupBy: 'variant' | 'channel' }) {
  const handoffColor = stat.stuckHandoffRate > 0.3 ? '#cf1322' : '#3f8600'
  return (
    <Card title={<span style={{ fontFamily: groupBy === 'variant' ? 'monospace' : 'inherit' }}>{groupLabel(groupBy, stat.group)}</span>}>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Statistic title={fa.salesAgentQuality.conversations} value={stat.conversations} />
        </Col>
        <Col span={12}>
          <Statistic
            title={fa.salesAgentQuality.stuckHandoffRate}
            value={pct(stat.stuckHandoffRate)}
            valueStyle={{ color: handoffColor }}
          />
        </Col>
        <Col span={12}>
          <Statistic title={fa.salesAgentQuality.approvedOrderRate} value={pct(stat.approvedOrderRate)} />
        </Col>
        <Col span={12}>
          <Statistic title={fa.salesAgentQuality.avgClarifyAttempts} value={stat.avgClarifyAttempts.toFixed(2)} />
        </Col>
        <Col span={12}>
          <Statistic title={fa.salesAgentQuality.aiCalls} value={stat.aiCalls} />
        </Col>
        <Col span={12}>
          <Statistic title={fa.salesAgentQuality.fallbackRate} value={pct(stat.fallbackRate)} />
        </Col>
        <Col span={24}>
          <Statistic title={fa.salesAgentQuality.avgLatencyMs} value={stat.avgLatencyMs} suffix="ms" />
        </Col>
      </Row>
    </Card>
  )
}

export function SalesAgentQualityPage() {
  const [page, setPage] = useState(1)
  const [groupBy, setGroupBy] = useState<'variant' | 'channel'>('variant')
  const [modelFilter, setModelFilter] = useState<string | undefined>(undefined)
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined)
  const [reasonFilter, setReasonFilter] = useState<'UNCLEAR' | 'NO_KB_MATCH' | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)
  const [traceConversationId, setTraceConversationId] = useState<string | null>(null)

  const statsParams = {
    storeId: storeFilter,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  }
  // مدل همیشه جدا واکشی می‌شود چون گزینه‌های فیلتر «مدل» جدول پایین به آن نیاز دارند، صرف‌نظر
  // از این‌که toggle کارت‌های بالا روی «کانال» باشد یا نه
  const { data: modelStats, isLoading: modelStatsLoading } = useAbStats({ groupBy: 'variant', ...statsParams })
  const { data: channelStats, isLoading: channelStatsLoading } = useAbStats({
    groupBy: 'channel',
    ...statsParams,
  })
  const abStats = groupBy === 'variant' ? modelStats : channelStats
  const abStatsLoading = groupBy === 'variant' ? modelStatsLoading : channelStatsLoading
  const { data: failedMessages, isLoading: failedLoading } = useFailedMessages({
    page,
    variant: modelFilter,
    storeId: storeFilter,
    reason: reasonFilter,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })

  const storeOptions = useMemo(() => {
    const names = new Set((failedMessages?.items ?? []).map((i) => i.storeName))
    return Array.from(names).map((name) => ({ value: name, label: name }))
  }, [failedMessages])

  const columns: ColumnsType<FailedMessageItem> = [
    {
      title: fa.salesAgentQuality.customerMessage,
      dataIndex: 'customerMessage',
      key: 'customerMessage',
      ellipsis: true,
    },
    {
      title: fa.salesAgentQuality.store,
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
    },
    {
      title: fa.salesAgentQuality.model,
      dataIndex: 'variant',
      key: 'variant',
      width: 150,
      render: (v: string | null) => (v ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> : '—'),
    },
    {
      title: fa.salesAgentQuality.reason,
      dataIndex: 'reason',
      key: 'reason',
      width: 140,
      render: (v: 'UNCLEAR' | 'NO_KB_MATCH') => (
        <Tag color={v === 'NO_KB_MATCH' ? 'orange' : 'default'}>
          {v === 'NO_KB_MATCH' ? fa.salesAgentQuality.reasonNoKbMatch : fa.salesAgentQuality.reasonUnclear}
        </Tag>
      ),
    },
    {
      title: fa.salesAgentQuality.status,
      dataIndex: 'endedInHandoff',
      key: 'endedInHandoff',
      width: 140,
      render: (v: boolean) => (
        <Tag color={v ? 'red' : 'default'}>
          {v ? fa.salesAgentQuality.endedInHandoff : fa.salesAgentQuality.resolvedByAgent}
        </Tag>
      ),
    },
    {
      title: fa.salesAgentQuality.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, item: FailedMessageItem) => (
        <Button size="small" onClick={() => setTraceConversationId(item.conversationId)}>
          {fa.salesAgentQuality.viewTrace}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.salesAgentQuality.title}
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button type={groupBy === 'variant' ? 'primary' : 'default'} onClick={() => setGroupBy('variant')}>
          {fa.salesAgentQuality.groupByModel}
        </Button>
        <Button type={groupBy === 'channel' ? 'primary' : 'default'} onClick={() => setGroupBy('channel')}>
          {fa.salesAgentQuality.groupByChannel}
        </Button>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {abStatsLoading || !abStats?.length ? (
          <Col span={24}>
            <Card loading={abStatsLoading}>{!abStatsLoading && fa.common.noData}</Card>
          </Col>
        ) : (
          abStats.map((stat) => (
            <Col xs={24} sm={12} lg={8} key={stat.group}>
              <AbStatCard stat={stat} groupBy={groupBy} />
            </Col>
          ))
        )}
      </Row>

      <Card title={fa.salesAgentQuality.failedMessagesTitle}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder={fa.salesAgentQuality.filterModel}
            style={{ width: 200 }}
            value={modelFilter}
            onChange={(v) => {
              setModelFilter(v)
              setPage(1)
            }}
            options={(modelStats ?? []).map((s) => ({ value: s.group, label: s.group }))}
          />
          <Select
            allowClear
            placeholder={fa.salesAgentQuality.filterStore}
            style={{ width: 200 }}
            value={storeFilter}
            onChange={(v) => {
              setStoreFilter(v)
              setPage(1)
            }}
            options={storeOptions}
          />
          <Select
            allowClear
            placeholder={fa.salesAgentQuality.filterReason}
            style={{ width: 200 }}
            value={reasonFilter}
            onChange={(v) => {
              setReasonFilter(v)
              setPage(1)
            }}
            options={[
              { value: 'UNCLEAR', label: fa.salesAgentQuality.reasonUnclear },
              { value: 'NO_KB_MATCH', label: fa.salesAgentQuality.reasonNoKbMatch },
            ]}
          />
          <RangePicker
            value={range}
            onChange={(v) => {
              setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
              setPage(1)
            }}
          />
        </Space>

        <Table<FailedMessageItem>
          rowKey="id"
          dataSource={failedMessages?.items ?? []}
          columns={columns}
          loading={failedLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: 20,
            total: failedMessages?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <ConversationTraceDrawer conversationId={traceConversationId} onClose={() => setTraceConversationId(null)} />
    </div>
  )
}
