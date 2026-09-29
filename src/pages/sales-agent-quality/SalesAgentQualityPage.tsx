import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAbStats, useFailedMessages } from '@/queries/sales-agent-quality.queries'
import type { AbModelStat, FailedMessageItem } from '@/types/api'
import { fa } from '@/locales/fa'

const { Title } = Typography
const { RangePicker } = DatePicker

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}٪`
}

function AbStatCard({ stat }: { stat: AbModelStat }) {
  const handoffColor = stat.stuckHandoffRate > 0.3 ? '#cf1322' : '#3f8600'
  return (
    <Card title={<span style={{ fontFamily: 'monospace' }}>{stat.variant}</span>}>
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
  const [modelFilter, setModelFilter] = useState<string | undefined>(undefined)
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined)
  const [reasonFilter, setReasonFilter] = useState<'UNCLEAR' | 'NO_KB_MATCH' | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)

  const { data: abStats, isLoading: abStatsLoading } = useAbStats()
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
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.salesAgentQuality.title}
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {abStatsLoading || !abStats?.length ? (
          <Col span={24}>
            <Card loading={abStatsLoading}>{!abStatsLoading && fa.common.noData}</Card>
          </Col>
        ) : (
          abStats.map((stat) => (
            <Col xs={24} sm={12} lg={8} key={stat.variant}>
              <AbStatCard stat={stat} />
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
            options={(abStats ?? []).map((s) => ({ value: s.variant, label: s.variant }))}
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
    </div>
  )
}
