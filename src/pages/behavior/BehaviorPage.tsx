import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert, AutoComplete, Button, Card, DatePicker, Empty, Input, InputNumber, Space,
  Table, Tabs, Tag, Timeline, Typography,
} from 'antd'
import { PlusOutlined, MinusCircleOutlined, SearchOutlined } from '@ant-design/icons'
import {
  useBehaviorOverview, useFunnel, useJourney, useTopNextEvents, useEventExplorer, useDimensionValues,
  type FunnelStep, type EventRecord,
} from '@/queries/behavior.queries'
import { FunnelCanvasChart } from './FunnelCanvasChart'
import { FlowCanvasChart } from './FlowCanvasChart'
import { VolumeCanvasChart } from './VolumeCanvasChart'

const { RangePicker } = DatePicker
const { Text } = Typography

// events-backend سرویس کاملاً مجزایی است — اگر ست نشده باشد (VITE_EVENTS_API_URL خالی)
// این بخش را به‌جای کرش کردن، با یک پیام واضح غیرفعال نشان می‌دهیم
function EventsServiceGuard({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.VITE_EVENTS_API_URL) {
    return (
      <Alert
        type="warning"
        showIcon
        message="سرویس رفتار کاربران پیکربندی نشده"
        description="برای فعال‌شدن این بخش، VITE_EVENTS_API_URL را در env این پنل تنظیم کن."
      />
    )
  }
  return <>{children}</>
}

function NextEventsCard({ eventNames, from, to }: { eventNames: string[]; from: string; to: string }) {
  const [after, setAfter] = useState<string | undefined>(undefined)
  const { data, isLoading } = useTopNextEvents(after ?? '', from, to)

  return (
    <Card title="مسیر بعدی محبوب">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          {eventNames.map((name) => (
            <Tag.CheckableTag key={name} checked={after === name} onChange={() => setAfter(name)}>
              {name}
            </Tag.CheckableTag>
          ))}
        </Space>
        {after && (
          <>
            <FlowCanvasChart source={after} targets={data ?? []} />
            {/* جدول = table view برای دسترسی‌پذیری، طبق قاعده‌ی dataviz skill (هر مقداری که
                نمودار نشون می‌ده باید بدون هاور هم قابل‌دسترسی باشه) */}
            <Table
              rowKey="nextEvent"
              loading={isLoading}
              pagination={false}
              size="small"
              dataSource={data ?? []}
              columns={[
                { title: `بعد از «${after}»`, dataIndex: 'nextEvent' },
                { title: 'تعداد', dataIndex: 'count', align: 'left' as const },
              ]}
            />
          </>
        )}
      </Space>
    </Card>
  )
}

function OverviewTab() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(6, 'day'), dayjs()])
  const from = range[0].startOf('day').toISOString()
  const to = range[1].endOf('day').toISOString()
  const { data, isLoading } = useBehaviorOverview(from, to)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <RangePicker value={range} onChange={(v) => v && setRange(v as [Dayjs, Dayjs])} allowClear={false} />
      <Card title="حجم ایونت‌ها در بازه" loading={isLoading}>
        <VolumeCanvasChart data={data?.daily ?? []} />
      </Card>
      <Card title="پرتکرارترین ایونت‌ها" loading={isLoading}>
        <Table
          rowKey="eventName"
          pagination={false}
          dataSource={data?.topEvents ?? []}
          columns={[
            { title: 'ایونت', dataIndex: 'eventName' },
            { title: 'تعداد', dataIndex: 'count', align: 'left' as const },
          ]}
        />
      </Card>
      {!!data?.topEvents.length && (
        <NextEventsCard eventNames={data.topEvents.map((e) => e.eventName)} from={from} to={to} />
      )}
    </Space>
  )
}

function FunnelTab() {
  const [steps, setSteps] = useState<FunnelStep[]>([{ eventName: '' }, { eventName: '' }])
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])
  const [windowHours, setWindowHours] = useState(24 * 7)
  const [campaign, setCampaign] = useState('')
  const funnel = useFunnel()
  const from = range[0].startOf('day').toISOString()
  const to = range[1].endOf('day').toISOString()
  const { data: campaignOptions } = useDimensionValues('utm_campaign', from, to)

  function updateStep(i: number, eventName: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { eventName } : s)))
  }

  function run() {
    const validSteps = steps.filter((s) => s.eventName.trim())
    if (validSteps.length < 2) return
    // فیلتر کمپین (utm_campaign) به هر مرحله اضافه می‌شود تا فانل فقط برای همون کمپین
    // محاسبه بشه — از همون مکانیزم عمومی filters هر مرحله استفاده می‌کند، بدون نیاز به
    // تغییر API؛ چون SDK فرانت utm_* را روی هر ایونتی (نه فقط اولین صفحه) attach می‌کند
    const withCampaign = campaign.trim()
      ? validSteps.map((s) => ({ ...s, filters: { ...s.filters, utm_campaign: campaign.trim() } }))
      : validSteps
    funnel.mutate({ steps: withCampaign, from, to, windowHours })
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="ساخت فانل">
        <Space direction="vertical" style={{ width: '100%' }}>
          {steps.map((step, i) => (
            <Space key={i} style={{ width: '100%' }}>
              <Text type="secondary" style={{ minWidth: 24 }}>{i + 1}.</Text>
              <Input
                placeholder="نام ایونت — مثلاً conversation_created"
                value={step.eventName}
                onChange={(e) => updateStep(i, e.target.value)}
                style={{ width: 320 }}
              />
              {steps.length > 2 && (
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                />
              )}
            </Space>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => setSteps((prev) => [...prev, { eventName: '' }])}>
            افزودن مرحله
          </Button>
          <Space wrap>
            <RangePicker value={range} onChange={(v) => v && setRange(v as [Dayjs, Dayjs])} allowClear={false} />
            <InputNumber
              addonBefore="حداکثر فاصله (ساعت)"
              min={1}
              max={24 * 30}
              value={windowHours}
              onChange={(v) => setWindowHours(v ?? 24 * 7)}
            />
            <AutoComplete
              placeholder="کمپین (utm_campaign) — اختیاری"
              style={{ width: 240 }}
              value={campaign}
              onChange={setCampaign}
              options={campaignOptions?.map((o) => ({ value: o.value, label: `${o.value} (${o.count})` }))}
              allowClear
            />
            <Button type="primary" onClick={run} loading={funnel.isPending}>
              محاسبه‌ی فانل
            </Button>
          </Space>
        </Space>
      </Card>

      {funnel.data && (
        <Card title={campaign.trim() ? `نتیجه — کمپین «${campaign.trim()}»` : 'نتیجه'}>
          <FunnelCanvasChart steps={funnel.data.steps} />
        </Card>
      )}
    </Space>
  )
}

function JourneyTab() {
  const [input, setInput] = useState('')
  const [actorId, setActorId] = useState('')
  const { data, isLoading } = useJourney(actorId)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="جست‌وجوی کاربر">
        <Space.Compact style={{ width: '100%', maxWidth: 480 }}>
          <Input
            placeholder="userId یا anonymousId یا sessionId"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => setActorId(input.trim())}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setActorId(input.trim())} />
        </Space.Compact>
      </Card>

      {actorId && (
        <Card title={`مسیر حرکت: ${actorId}`} loading={isLoading}>
          {data?.length ? (
            <Timeline
              items={data.map((event: EventRecord) => ({
                children: (
                  <>
                    <Text strong>{event.eventName}</Text>{' '}
                    <Text type="secondary">{dayjs(event.receivedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                    {event.url && <div><Text type="secondary" style={{ fontSize: 12 }}>{event.url}</Text></div>}
                  </>
                ),
              }))}
            />
          ) : (
            <Empty description="ایونتی پیدا نشد" />
          )}
        </Card>
      )}
    </Space>
  )
}

function ExplorerTab() {
  const [eventName, setEventName] = useState('')
  const [userId, setUserId] = useState('')
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [page, setPage] = useState(1)
  const filters = useMemo(
    () => ({
      eventName: eventName || undefined,
      userId: userId || undefined,
      from: range?.[0].startOf('day').toISOString(),
      to: range?.[1].endOf('day').toISOString(),
      page,
      pageSize: 20,
    }),
    [eventName, userId, range, page],
  )
  const { data, isLoading } = useEventExplorer(filters)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space wrap>
        <RangePicker
          value={range}
          onChange={(v) => { setRange(v as [Dayjs, Dayjs] | null); setPage(1) }}
          allowClear
          placeholder={['از تاریخ', 'تا تاریخ']}
        />
        <Input
          placeholder="فیلتر نام ایونت"
          value={eventName}
          onChange={(e) => { setEventName(e.target.value); setPage(1) }}
          style={{ width: 240 }}
        />
        <Input
          placeholder="فیلتر userId"
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setPage(1) }}
          style={{ width: 240 }}
        />
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        columns={[
          { title: 'ایونت', dataIndex: 'eventName', render: (v: string) => <Tag color="blue">{v}</Tag> },
          { title: 'کاربر', dataIndex: 'userId', render: (v: string | null) => v ?? '—' },
          { title: 'session', dataIndex: 'sessionId', ellipsis: true },
          {
            title: 'زمان',
            dataIndex: 'receivedAt',
            render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
          },
        ]}
      />
    </Space>
  )
}

export function BehaviorPage() {
  return (
    <EventsServiceGuard>
      <Tabs
        defaultActiveKey="overview"
        items={[
          { key: 'overview', label: 'نمای کلی', children: <OverviewTab /> },
          { key: 'funnel', label: 'فانل', children: <FunnelTab /> },
          { key: 'journey', label: 'مسیر کاربر', children: <JourneyTab /> },
          { key: 'explorer', label: 'ایونت‌ها', children: <ExplorerTab /> },
        ]}
      />
    </EventsServiceGuard>
  )
}
