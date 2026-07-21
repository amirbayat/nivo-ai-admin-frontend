import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Card, Col, Row, Statistic, Spin, Space, Select, Table, Tag, Modal, Typography, Empty } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useAnonAnalyticsCampaigns,
  useAnonAnalyticsOverview,
  useAnonAnalyticsSessions,
  useAnonAnalyticsTimeseries,
  fetchAnonSessionConversationMessages,
} from '@/queries/anon-analytics.queries'
import type { AnonAnalyticsSessionRow, AnonSessionConversation, AnonSessionMessage } from '@/types/api'
import { AnonTrendCanvasChart } from './AnonTrendCanvasChart'

const { Text } = Typography

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}٪`
}

const roleLabel: Record<AnonSessionMessage['role'], string> = {
  USER: 'کاربر',
  ASSISTANT: 'دستیار',
  SYSTEM: 'سیستم',
}

// چون فقط منبع/کمپین UTM در جدول اصلی نشست‌ها ستون دارد، بقیه‌ی داده‌ی attribution
// (که همان لحظه‌ی اول ورود ثبت شده — anon-identity.service.ts) اینجا در مودال دیده می‌شود
function AttributionRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <Text type="secondary" style={{ minWidth: 120 }}>{label}</Text>
      <Text style={{ wordBreak: 'break-all' }}>{value}</Text>
    </div>
  )
}

interface Props {
  from: string
  to: string
}

export function OverviewTab({ from, to }: Props) {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [utmSource, setUtmSource] = useState<string | undefined>(undefined)
  const [utmCampaign, setUtmCampaign] = useState<string | undefined>(undefined)
  const [selectedSession, setSelectedSession] = useState<AnonAnalyticsSessionRow | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<AnonSessionConversation | null>(null)
  const [messages, setMessages] = useState<AnonSessionMessage[] | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [from, to, utmSource, utmCampaign])

  const { data: overview, isLoading: overviewLoading } = useAnonAnalyticsOverview(from, to)
  const { data: timeseries } = useAnonAnalyticsTimeseries(from, to)
  const { data: campaigns } = useAnonAnalyticsCampaigns(from, to)
  const { data: sessions, isLoading: sessionsLoading } = useAnonAnalyticsSessions(
    from, to, page, pageSize, utmSource, utmCampaign,
  )

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

  function openConversationMessages(conversation: AnonSessionConversation) {
    setSelectedConversation(conversation)
    setMessages(null)
    setMessagesLoading(true)
    fetchAnonSessionConversationMessages(conversation.id)
      .then(setMessages)
      .finally(() => setMessagesLoading(false))
  }

  const columns: ColumnsType<AnonAnalyticsSessionRow> = [
    { title: 'IP', dataIndex: ['identity', 'ip'], key: 'ip' },
    {
      title: 'اولین بازدید',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'آخرین بازدید',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'تعداد پیام',
      dataIndex: ['identity', 'lifetimeMessageCount'],
      key: 'messageCount',
    },
    { title: 'منبع UTM', dataIndex: 'utmSource', key: 'utmSource', render: (v: string | null) => v ?? '—' },
    { title: 'کمپین UTM', dataIndex: 'utmCampaign', key: 'utmCampaign', render: (v: string | null) => v ?? '—' },
    {
      title: 'تبدیل شده؟',
      dataIndex: 'migratedToUserId',
      key: 'migrated',
      render: (v: string | null) => (v ? <Tag color="green">بله</Tag> : <Tag>خیر</Tag>),
    },
  ]

  return (
    <div>
      {overviewLoading || !overview ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="تعداد IP یکتا" value={overview.totalIdentities} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="تعداد نشست" value={overview.totalSessions} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="تعداد پیام" value={overview.totalMessages} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="نشست‌های تبدیل‌شده" value={overview.convertedSessions} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="نرخ تبدیل" value={pct(overview.conversionRate)} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card><Statistic title="میانگین پیام هر نشست" value={overview.avgMessagesPerSession.toFixed(1)} /></Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginTop: 16 }} title="روند نشست و پیام">
        {timeseries ? <AnonTrendCanvasChart data={timeseries} /> : <Spin />}
      </Card>

      <Card
        style={{ marginTop: 16 }}
        title="نشست‌ها"
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
        <Table<AnonAnalyticsSessionRow>
          rowKey="id"
          dataSource={sessions?.rows ?? []}
          columns={columns}
          loading={sessionsLoading}
          size="small"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'داده‌ای یافت نشد' }}
          pagination={{
            current: page,
            pageSize,
            total: sessions?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
          onRow={(record) => ({
            onClick: () => setSelectedSession(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        open={Boolean(selectedSession)}
        onCancel={() => setSelectedSession(null)}
        title={selectedSession ? `این کاربر از کجا اومده؟ — ${selectedSession.identity.ip}` : 'این کاربر از کجا اومده؟'}
        footer={null}
        width={640}
      >
        {selectedSession && (
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
            {[
              selectedSession.referrer, selectedSession.landingPath, selectedSession.utmSource,
              selectedSession.utmCampaign, selectedSession.utmMedium, selectedSession.utmContent, selectedSession.utmTerm,
            ].every((v) => !v) ? (
              <Text type="secondary">بدون ریفرر یا UTM — احتمالاً ورود مستقیم (تایپ آدرس یا بوکمارک)</Text>
            ) : (
              <>
                <AttributionRow label="ریفرر (سایت/لینک قبلی)" value={selectedSession.referrer} />
                <AttributionRow label="صفحه‌ی ورود" value={selectedSession.landingPath} />
                <AttributionRow label="منبع UTM" value={selectedSession.utmSource} />
                <AttributionRow label="کمپین UTM" value={selectedSession.utmCampaign} />
                <AttributionRow label="مدیوم UTM" value={selectedSession.utmMedium} />
                <AttributionRow label="محتوای UTM" value={selectedSession.utmContent} />
                <AttributionRow label="عبارت UTM" value={selectedSession.utmTerm} />
              </>
            )}
          </Space>
        )}
        {selectedSession && selectedSession.conversations.length === 0 && (
          <Empty description="این نشست هنوز مکالمه‌ای ندارد" />
        )}
        <Space direction="vertical" style={{ width: '100%' }}>
          {selectedSession?.conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => openConversationMessages(c)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', border: '1px solid #f0f0f0', borderRadius: 6, cursor: 'pointer',
              }}
            >
              <Text>{c.title ?? 'بدون عنوان'}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                آخرین پیام: {dayjs(c.lastMessageAt).format('YYYY-MM-DD HH:mm')}
              </Text>
            </div>
          ))}
        </Space>
      </Modal>

      <Modal
        open={Boolean(selectedConversation)}
        onCancel={() => { setSelectedConversation(null); setMessages(null) }}
        title={`محتوای مکالمه — ${selectedConversation?.title ?? 'بدون عنوان'}`}
        footer={null}
        width={640}
      >
        {messagesLoading ? (
          <Spin />
        ) : (
          <Space direction="vertical" style={{ width: '100%', maxHeight: 480, overflowY: 'auto' }}>
            {(messages ?? []).map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: m.role === 'USER' ? '#e6f4ff' : '#f5f5f5',
                }}
              >
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  {roleLabel[m.role]}{m.model ? ` — ${m.model}` : ''}
                </Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{m.content}</Text>
              </div>
            ))}
            {messages && messages.length === 0 && <Empty description="پیامی یافت نشد" />}
          </Space>
        )}
      </Modal>
    </div>
  )
}
