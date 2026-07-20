import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Card, Col, Row, Statistic, Spin, Typography, Space, Switch,
  DatePicker, Segmented, Table, Tag, Select, Button, Tooltip, Modal,
} from 'antd'
import {
  DollarOutlined, MessageOutlined, RiseOutlined, FallOutlined,
  WarningOutlined, SettingOutlined, QuestionCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  useAnalyticsOverview, useAnalyticsTimeseries, useAnalyticsModels, useAnalyticsTopics,
  useAnalyticsLimitHits, useAnalyticsUsers, useAnalyticsUserModels, useAnalyticsSegmentBreakdown,
  downloadAnalyticsUsersCsv,
} from '@/queries/analytics.queries'
import type {
  AnalyticsModelBreakdown, AnalyticsModelTypeBreakdown, AnalyticsSegmentBreakdown, AnalyticsUserRow,
} from '@/types/api'
import { fa } from '@/locales/fa'
import { SegmentsManager } from './SegmentsManager'
import { TopicsManager } from './TopicsManager'
import { TrendCanvasChart } from './TrendCanvasChart'

const { RangePicker } = DatePicker
const { Title, Text } = Typography

function toman(amountToman: number): string {
  return Math.round(amountToman).toLocaleString('fa-IR')
}

function pct(v: number | null): string {
  if (v === null) return '—'
  return `${(v * 100).toFixed(1)}٪`
}

function usd(v: number): string {
  return `$${v.toFixed(v < 1 ? 4 : 2)}`
}

function ModelTypeSection({ title, data }: { title: string; data: AnalyticsModelTypeBreakdown }) {
  return (
    <Card style={{ marginTop: 16 }} title={title}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic title={fa.analytics.avgTokensPerMessage} value={data.avgTokensPerMessage} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={fa.analytics.avgInputPrice}
            value={`${toman(data.avgInputPricePerMillionToman)} ت`}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{usd(data.avgInputPricePerMillionUsd)}</Text>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={fa.analytics.avgOutputPrice}
            value={`${toman(data.avgOutputPricePerMillionToman)} ت`}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{usd(data.avgOutputPricePerMillionUsd)}</Text>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={fa.analytics.topModel}
            value={data.topModel ?? '—'}
            valueStyle={{ fontFamily: 'monospace', fontSize: 16 }}
          />
        </Col>
      </Row>
    </Card>
  )
}

function GrowthTag({ value }: { value: number | null }) {
  if (value === null) return null
  const positive = value >= 0
  return (
    <Tag color={positive ? 'green' : 'red'} icon={positive ? <RiseOutlined /> : <FallOutlined />}>
      {pct(Math.abs(value))}
    </Tag>
  )
}

// docs/PRD-liara-usage-reconciliation.md — null یعنی هنوز داده‌ی واقعی لیارا نداریم (نه ۰٪،
// که با رنگ قرمز اشتباه‌گرفته می‌شد)
function LiaraMatchTag({ matchPct }: { matchPct: number | null }) {
  if (matchPct === null) return <Text type="secondary">{fa.analytics.liaraNoData}</Text>
  const color = matchPct >= 95 ? 'green' : matchPct >= 80 ? 'orange' : 'red'
  return <Tag color={color}>{matchPct.toFixed(1)}٪</Tag>
}

export function AnalyticsPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])
  const [compare, setCompare] = useState(false)
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [segmentFilter, setSegmentFilter] = useState<string | undefined>(undefined)
  const [segmentsOpen, setSegmentsOpen] = useState(false)
  const [topicsOpen, setTopicsOpen] = useState(false)
  const [modalUserId, setModalUserId] = useState<string | null>(null)

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(from, to, compare)
  const { data: timeseries } = useAnalyticsTimeseries(from, to, granularity)
  const { data: models } = useAnalyticsModels(from, to)
  const { data: topics } = useAnalyticsTopics(from, to)
  const { data: limitHits } = useAnalyticsLimitHits(from, to)
  const { data: users, isLoading: usersLoading } = useAnalyticsUsers(from, to, segmentFilter)
  const { data: segmentBreakdown } = useAnalyticsSegmentBreakdown(from, to)
  const { data: userModels, isLoading: userModelsLoading } = useAnalyticsUserModels(modalUserId ?? undefined, from, to)
  const modalUser = users?.find((u) => u.userId === modalUserId) ?? null

  const segmentOptions = useMemo(
    () => (segmentBreakdown ?? []).map((s) => ({ label: `${s.label} (${s.userCount})`, value: s.label })),
    [segmentBreakdown],
  )

  const modelColumns: ColumnsType<AnalyticsModelBreakdown> = [
    { title: 'مدل', dataIndex: 'model', key: 'model', render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    {
      title: fa.analytics.modelTypeColumn,
      dataIndex: 'modelType',
      key: 'modelType',
      render: (v: 'TEXT' | 'IMAGE') => (
        <Tag color={v === 'IMAGE' ? 'purple' : 'blue'}>
          {v === 'IMAGE' ? fa.analytics.modelTypeImage : fa.analytics.modelTypeText}
        </Tag>
      ),
    },
    { title: 'پیام', dataIndex: 'messages', key: 'messages' },
    { title: 'توکن ورودی', dataIndex: 'tokensInput', key: 'tokensInput' },
    { title: 'توکن خروجی', dataIndex: 'tokensOutput', key: 'tokensOutput' },
    { title: 'هزینه (تومان)', dataIndex: 'costToman', key: 'costToman', render: (v: number) => toman(v).toString() },
    {
      title: 'هزینه ورودی',
      key: 'costInput',
      render: (_, r) => `${toman(r.costInputToman)} ت / ${usd(r.costInputUsd)}`,
    },
    {
      title: 'هزینه خروجی',
      key: 'costOutput',
      render: (_, r) => `${toman(r.costOutputToman)} ت / ${usd(r.costOutputUsd)}`,
    },
    {
      title: (
        <Space size={4}>
          قیمت ورودی/خروجی (هر ۱M توکن)
          <Tooltip title={fa.analytics.perModelPriceHint}>
            <QuestionCircleOutlined style={{ color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      key: 'avgPrice',
      render: (_, r) => `${usd(r.avgInputPricePerMillionUsd)} / ${usd(r.avgOutputPricePerMillionUsd)}`,
    },
  ]

  const segmentColumns: ColumnsType<AnalyticsSegmentBreakdown> = [
    { title: 'دسته', dataIndex: 'label', key: 'label' },
    { title: 'تعداد کاربر', dataIndex: 'userCount', key: 'userCount' },
    {
      title: 'میانگین/میانه پیام روزانه',
      key: 'msg',
      render: (_, r) => `${r.avgMessagesPerDay.toFixed(1)} / ${r.medianMessagesPerDay.toFixed(1)}`,
    },
    {
      title: 'میانگین/میانه توکن روزانه',
      key: 'tok',
      render: (_, r) => `${Math.round(r.avgTokensPerDay)} / ${Math.round(r.medianTokensPerDay)}`,
    },
    { title: 'هزینه (تومان)', dataIndex: 'costToman', key: 'costToman', render: (v: number) => toman(v) },
    { title: 'هزینه (دلار)', dataIndex: 'costUsd', key: 'costUsd', render: (v: number) => usd(v) },
    { title: 'درآمد (تومان)', dataIndex: 'revenueToman', key: 'revenueToman', render: (v: number) => toman(v) },
    {
      title: 'حاشیه سود',
      key: 'margin',
      render: (_, r) => (
        <Tag color={r.marginPct !== null && r.marginPct < 0 ? 'red' : 'green'}>
          {toman(r.marginToman)} ({pct(r.marginPct)})
        </Tag>
      ),
    },
  ]

  const userColumns: ColumnsType<AnalyticsUserRow> = [
    { title: 'موبایل', dataIndex: 'phone', key: 'phone' },
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'پیام', dataIndex: 'messages', key: 'messages' },
    {
      title: 'توکن (ورودی/خروجی)',
      key: 'tokens',
      render: (_, r) => `${r.tokensInput} / ${r.tokensOutput}`,
    },
    { title: 'هزینه (تومان)', dataIndex: 'costToman', key: 'costToman', render: (v: number) => toman(v) },
    { title: 'درآمد (تومان)', dataIndex: 'revenueToman', key: 'revenueToman', render: (v: number) => toman(v) },
    {
      title: 'حاشیه سود',
      dataIndex: 'marginToman',
      key: 'marginToman',
      render: (v: number) => <Tag color={v < 0 ? 'red' : 'green'}>{toman(v)}</Tag>,
    },
    { title: 'پرمصرف‌ترین مدل', dataIndex: 'mostUsedModel', key: 'mostUsedModel', render: (v: string | null) => v ?? '—' },
    {
      title: fa.analytics.textUsageColumn,
      key: 'textUsage',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.text.messages} پیام / {toman(r.text.costToman)} ت</span>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.text.mostUsedModel ?? '—'}</Text>
        </Space>
      ),
    },
    {
      title: fa.analytics.imageUsageColumn,
      key: 'imageUsage',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.image.messages} پیام / {toman(r.image.costToman)} ت</span>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.image.mostUsedModel ?? '—'}</Text>
        </Space>
      ),
    },
    {
      title: 'دسته',
      dataIndex: 'segment',
      key: 'segment',
      render: (v: string | null) => (v ? <Tag>{v}</Tag> : <Tag>{fa.analytics.noSegment}</Tag>),
    },
    {
      title: fa.analytics.liaraRealCost,
      dataIndex: 'liaraRealCostToman',
      key: 'liaraRealCostToman',
      render: (v: number | null) => (v === null ? fa.analytics.liaraNoData : toman(v)),
    },
    { title: fa.analytics.liaraRequestCount, dataIndex: 'liaraRequestCount', key: 'liaraRequestCount' },
    {
      title: (
        <Space size={4}>
          {fa.analytics.liaraMatchPct}
          <Tooltip title={fa.analytics.liaraMatchPctHint}>
            <QuestionCircleOutlined style={{ color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      key: 'liaraMatchPct',
      render: (_, r) => <LiaraMatchTag matchPct={r.liaraMatchPct} />,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.analytics.title}</Title>
        <Space wrap>
          <RangePicker
            value={range}
            onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])}
            allowClear={false}
          />
          <Space size={4}>
            <Text style={{ fontSize: 13 }}>{fa.analytics.compare}</Text>
            <Switch checked={compare} onChange={setCompare} size="small" />
          </Space>
          <Button icon={<SettingOutlined />} onClick={() => setSegmentsOpen(true)}>{fa.analytics.manageSegments}</Button>
          <Button icon={<SettingOutlined />} onClick={() => setTopicsOpen(true)}>{fa.analytics.manageTopics}</Button>
        </Space>
      </div>

      {overviewLoading || !overview ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.totalTokens} value={overview.current.totalTokens} />
              <GrowthTag value={overview.growth?.totalTokens ?? null} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.totalMessages} value={overview.current.totalMessages} prefix={<MessageOutlined style={{ marginLeft: 6 }} />} />
              <GrowthTag value={overview.growth?.totalMessages ?? null} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.costToman} value={toman(overview.current.costToman)} prefix={<DollarOutlined style={{ marginLeft: 6 }} />} />
              <Text type="secondary" style={{ fontSize: 12 }}>${overview.current.costUsd.toFixed(2)}</Text>
              <GrowthTag value={overview.growth?.costToman ?? null} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.revenue} value={toman(overview.current.revenueToman)} />
              <GrowthTag value={overview.growth?.revenueToman ?? null} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title={fa.analytics.margin}
                value={toman(overview.current.marginToman)}
                valueStyle={{ color: overview.current.marginToman < 0 ? '#ef4444' : '#10b981' }}
                suffix={overview.current.marginPct !== null ? `(${pct(overview.current.marginPct)})` : undefined}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title={fa.analytics.avgTokensPerMessage} value={overview.current.avgTokensPerMessage} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card><Statistic title={fa.analytics.topModel} value={overview.current.topModel ?? '—'} valueStyle={{ fontFamily: 'monospace', fontSize: 16 }} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.avgInputTokensPerMessage} value={overview.current.avgInputTokensPerMessage} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.avgOutputTokensPerMessage} value={overview.current.avgOutputTokensPerMessage} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <Space size={4}>
                    {fa.analytics.avgInputPrice}
                    <Tooltip title={fa.analytics.perMillionTokensHint}>
                      <QuestionCircleOutlined style={{ color: '#888' }} />
                    </Tooltip>
                  </Space>
                }
                value={`${toman(overview.current.avgInputPricePerMillionToman)} ت`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{usd(overview.current.avgInputPricePerMillionUsd)}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>{fa.analytics.weightedAvgHint}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <Space size={4}>
                    {fa.analytics.avgOutputPrice}
                    <Tooltip title={fa.analytics.perMillionTokensHint}>
                      <QuestionCircleOutlined style={{ color: '#888' }} />
                    </Tooltip>
                  </Space>
                }
                value={`${toman(overview.current.avgOutputPricePerMillionToman)} ت`}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{usd(overview.current.avgOutputPricePerMillionUsd)}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>{fa.analytics.weightedAvgHint}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title={fa.analytics.liaraRealCost} value={toman(overview.current.liaraRealCostToman)} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={
                  <Space size={4}>
                    {fa.analytics.liaraMatchPct}
                    <Tooltip title={fa.analytics.liaraMatchPctHint}>
                      <QuestionCircleOutlined style={{ color: '#888' }} />
                    </Tooltip>
                  </Space>
                }
                valueRender={() => <LiaraMatchTag matchPct={overview.current.liaraMatchPct} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {overview && (
        <>
          <ModelTypeSection title={fa.analytics.textModelsSectionTitle} data={overview.current.text} />
          <ModelTypeSection title={fa.analytics.imageModelsSectionTitle} data={overview.current.image} />
        </>
      )}

      <Card
        style={{ marginTop: 16 }}
        title={fa.analytics.trendTitle}
        extra={
          <Segmented
            value={granularity}
            onChange={(v) => setGranularity(v as typeof granularity)}
            options={[
              { label: fa.analytics.granularity.day, value: 'day' },
              { label: fa.analytics.granularity.week, value: 'week' },
              { label: fa.analytics.granularity.month, value: 'month' },
            ]}
          />
        }
      >
        {timeseries ? <TrendCanvasChart data={timeseries} /> : <Spin />}
      </Card>

      <Card style={{ marginTop: 16 }} title={fa.analytics.modelsTitle}>
        <Table rowKey="model" dataSource={models ?? []} columns={modelColumns} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </Card>

      <Card style={{ marginTop: 16 }} title={fa.analytics.topicsTitle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {(topics ?? []).map((t) => (
            <div key={t.topicId ?? 'none'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color={t.color ?? 'default'}>{t.name}</Tag>
              <Text>{t.messages} پیام ({pct(t.pct)})</Text>
            </div>
          ))}
        </Space>
      </Card>

      {limitHits && limitHits.uniqueUsers > 0 && (
        <Card style={{ marginTop: 16 }} title={fa.analytics.limitHitsTitle}>
          <Space wrap>
            <Tag icon={<WarningOutlined />} color="orange">
              {fa.analytics.uniqueUsersHitLimit}: {limitHits.uniqueUsers}
            </Tag>
            {limitHits.byType.map((b) => (
              <Tag key={b.type}>{b.type}: {b.count}</Tag>
            ))}
          </Space>
        </Card>
      )}

      <Card style={{ marginTop: 16 }} title={fa.analytics.segmentsTitle}>
        <Table rowKey="label" dataSource={segmentBreakdown ?? []} columns={segmentColumns} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </Card>

      <Card
        style={{ marginTop: 16 }}
        title={fa.analytics.usersTitle}
        extra={
          <Space>
            <Select
              allowClear
              placeholder="فیلتر بر اساس دسته"
              style={{ width: 200 }}
              options={segmentOptions}
              value={segmentFilter}
              onChange={setSegmentFilter}
            />
            <Button onClick={() => void downloadAnalyticsUsersCsv(from, to, segmentFilter)}>
              {fa.analytics.exportCsv}
            </Button>
          </Space>
        }
      >
        <Table<AnalyticsUserRow>
          rowKey="userId"
          dataSource={users ?? []}
          columns={userColumns}
          loading={usersLoading}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: fa.common.noData }}
          onRow={(record) => ({
            onClick: () => setModalUserId(record.userId),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        open={Boolean(modalUserId)}
        onCancel={() => setModalUserId(null)}
        title={modalUser ? `${fa.analytics.userModelsTitle} — ${modalUser.name ?? modalUser.phone}` : fa.analytics.userModelsTitle}
        footer={null}
        width={720}
      >
        <Table<AnalyticsModelBreakdown>
          rowKey="model"
          dataSource={userModels ?? []}
          columns={modelColumns}
          loading={userModelsLoading}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: fa.common.noData }}
        />
      </Modal>

      <SegmentsManager open={segmentsOpen} onClose={() => setSegmentsOpen(false)} />
      <TopicsManager open={topicsOpen} onClose={() => setTopicsOpen(false)} />
    </div>
  )
}
