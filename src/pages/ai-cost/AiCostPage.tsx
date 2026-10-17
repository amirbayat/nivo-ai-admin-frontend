import { useState } from 'react'
import { Alert, Button, Card, Col, Descriptions, Row, Segmented, Statistic, Modal, Popconfirm, Radio, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useAceSettings,
  useAceStoreSearch,
  useBotChangelog,
  useCompareReport,
  useCostReport,
  useEmergencyRevert,
  useUndoEmergencyRevert,
  useUpdateAceSettings,
  type AceAuditEntry,
  type BotChangelogEntry,
  type CostReport,
  type EngineMode,
  type EngineSide,
  type LayerMode,
} from '@/queries/ai-cost.queries'

const { Title, Text } = Typography

const money = (v: number) => `$${v.toFixed(v < 1 ? 4 : 2)}`
const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}٪`)

function DaysSwitch({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return <Segmented value={value} onChange={(v) => onChange(Number(v))} options={[{ value: 1, label: '۱ روز' }, { value: 7, label: '۷ روز' }, { value: 30, label: '۳۰ روز' }]} />
}

function NotReady({ error }: { error?: string }) {
  return <Alert type="warning" showIcon message="گزارش هنوز آماده نیست (جدول ledger؟)" description={error} />
}

function CostTab() {
  const [days, setDays] = useState(7)
  const { data, isLoading } = useCostReport(days)
  if (isLoading || !data) return <Card loading />
  if (!data.ready) return <NotReady error={data.error} />
  const c = data.cards
  const siteCols: ColumnsType<CostReport['bySite'][number]> = [
    { title: 'callSite', dataIndex: 'callSite' },
    { title: 'مدل', dataIndex: 'model' },
    { title: 'تعداد', dataIndex: 'calls' },
    { title: 'هزینه', dataIndex: 'costUsd', render: money, sorter: (a, b) => a.costUsd - b.costUsd },
    { title: 'میانگین ورودی', dataIndex: 'avgIn' },
    { title: 'میانگین خروجی', dataIndex: 'avgOut' },
    { title: 'p95 latency', dataIndex: 'p95LatencyMs', render: (v: number) => `${v}ms` },
    { title: 'ردیف با هزینه‌ی صفر', dataIndex: 'zeroCostRows' },
  ]
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <DaysSwitch value={days} onChange={setDays} />
      {c.estimatedRowsPct > 0.05 && <Alert type="warning" showIcon message={`${pct(c.estimatedRowsPct)} ردیف‌ها هزینه‌ی تخمینی دارند (OpenRouter هزینه نداده)؛ اول این درست شود.`} />}
      {c.untaggedCostPct > 0.05 && <Alert type="warning" showIcon message={`${pct(c.untaggedCostPct)} هزینه برچسب callSite ندارد (untagged).`} />}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Statistic title="هزینه‌ی واقعی" value={money(c.realCostUsd)} /></Col>
        <Col xs={12} md={6}><Statistic title="میانه‌ی هزینه‌ی هر گفتگو" value={money(c.medianConversationCostUsd)} /></Col>
        <Col xs={12} md={6}><Statistic title="p90 هزینه‌ی هر گفتگو" value={money(c.p90ConversationCostUsd)} /></Col>
        <Col xs={12} md={6}><Statistic title="نرخ cache-read (main_loop)" value={pct(c.cacheReadRate)} /></Col>
        <Col xs={12} md={6}><Statistic title="گفتگو / نوبت" value={`${c.conversations} / ${c.turns}`} /></Col>
        <Col xs={12} md={6}><Statistic title="هزینه‌ی تخمینی (ردیف‌های بدون cost)" value={money(c.estimatedCostUsd)} /></Col>
        <Col xs={12} md={6}><Statistic title="صرفه‌جویی تخمینی (avoided)" value={money(c.avoidedEstimatedUsd)} suffix={<Tag>تخمینی</Tag>} /></Col>
      </Row>
      <Card title="callSite × مدل"><Table rowKey={(r) => r.callSite + r.model} size="small" columns={siteCols} dataSource={data.bySite} pagination={false} /></Card>
      <Card title="روزانه"><Table rowKey="day" size="small" pagination={false} dataSource={data.daily} columns={[{ title: 'روز', dataIndex: 'day' }, { title: 'هزینه', dataIndex: 'costUsd', render: money }, { title: 'تعداد call', dataIndex: 'calls' }]} /></Card>
      <Card title="servedBy"><Table rowKey="servedBy" size="small" pagination={false} dataSource={data.servedBy} columns={[{ title: 'منبع جواب', dataIndex: 'servedBy' }, { title: 'تعداد', dataIndex: 'calls' }, { title: 'هزینه', dataIndex: 'costUsd', render: money }, { title: 'avoided (تخمینی)', dataIndex: 'avoidedUsd', render: money }]} /></Card>
      <Card title="۲۰ گفتگوی پرهزینه"><Table rowKey="conversationId" size="small" pagination={false} dataSource={data.topConversations} columns={[{ title: 'گفتگو', dataIndex: 'conversationId' }, { title: 'هزینه', dataIndex: 'costUsd', render: money }, { title: 'نوبت', dataIndex: 'turns' }, { title: 'call', dataIndex: 'calls' }]} /></Card>
      <Card title="۲۰ فروشگاه پرهزینه"><Table rowKey="storeId" size="small" pagination={false} dataSource={data.topStores} columns={[{ title: 'فروشگاه', dataIndex: 'name' }, { title: 'هزینه', dataIndex: 'costUsd', render: money }, { title: 'گفتگو', dataIndex: 'conversations' }]} /></Card>
    </Space>
  )
}

function CompareTab() {
  const [days, setDays] = useState(7)
  const { data, isLoading } = useCompareReport(days)
  if (isLoading || !data) return <Card loading />
  if (!data.ready) return <NotReady error={data.error} />
  const rows: Array<{ k: string; label: string; f: (s: EngineSide) => string }> = [
    { k: 'n', label: 'تعداد گفتگو', f: (s) => String(s.conversations) },
    { k: 'med', label: 'میانه‌ی هزینه‌ی گفتگو', f: (s) => money(s.medianCostUsd) },
    { k: 'p90', label: 'p90 هزینه‌ی گفتگو', f: (s) => money(s.p90CostUsd) },
    { k: 'tin', label: 'توکن ورودی میانه', f: (s) => String(s.medianInputTokens) },
    { k: 'cr', label: 'نرخ cache-read', f: (s) => pct(s.cacheReadRate) },
    { k: 'ord', label: 'نرخ سفارش', f: (s) => pct(s.orderRate) },
    { k: 'ho', label: 'نرخ ارجاع به فروشنده', f: (s) => pct(s.handoffRate) },
    { k: 'turns', label: 'میانه‌ی تعداد نوبت', f: (s) => String(s.medianTurns) },
    { k: 'l50', label: 'latency p50 (main_loop)', f: (s) => `${s.latencyP50Ms}ms` },
    { k: 'l95', label: 'latency p95 (main_loop)', f: (s) => `${s.latencyP95Ms}ms` },
  ]
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <DaysSwitch value={days} onChange={setDays} />
      {(!data.stable.enoughData || !data.lean.enoughData) && (
        <Alert type="info" showIcon message="کمتر از ۱۰۰ گفتگو در یکی از دو طرف؛ هنوز قابل قضاوت نیست." />
      )}
      <Table rowKey="k" pagination={false} dataSource={rows} columns={[
        { title: '', dataIndex: 'label' },
        { title: 'پایدار', render: (_, r) => r.f(data.stable) },
        { title: 'بهینه', render: (_, r) => r.f(data.lean) },
      ]} />
    </Space>
  )
}

const ENGINE_LABEL: Record<EngineMode, string> = { stable: 'پایدار', lean: 'بهینه' }

// بخش ۹ سند: توضیح هر لایه. ledger تنها لایه‌ای است که در هر دو موتور اثر دارد.
const LAYERS: Array<{ key: string; label: string; hint: string; both?: boolean }> = [
  { key: 'ledger', label: 'ثبت هزینه (ledger)', hint: 'فقط ثبت مصرف هر call؛ جواب را عوض نمی‌کند. خاموش = meter کاملاً دور زده می‌شود.', both: true },
  { key: 'embedCache', label: 'کش embedding', hint: 'متن یکسان → یک embedding در ۷ روز' },
  { key: 'ttsCache', label: 'کش صوت', hint: 'متن یکسان → یک سنتز صوت' },
  { key: 'memo', label: 'کش دقیق زیرفراخوانی‌ها', hint: 'همان ورودی دقیق قبلاً پرسیده شده' },
  { key: 'promptCache', label: 'کش prompt', hint: 'بازچینی prompt برای کش provider' },
  { key: 'subcallDiet', label: 'رژیم زیرفراخوانی‌ها', hint: 'مدل سبک و قالب ثابت برای کارهای کوچک' },
  { key: 'loopDiet', label: 'رژیم حلقه‌ی اصلی', hint: 'خلاصه‌ی ابزار، بودجه‌ی step، repair-retry' },
  { key: 'dedupe', label: 'پیام تکراری', hint: 'همان پیام در ۳۰ ثانیه → همان جواب قبلی' },
  { key: 'offTopicBudget', label: 'بودجه‌ی off-topic', hint: 'بعد از ۳ پیام بی‌ربط پشت‌سرهم، قالب ثابت' },
  { key: 'fastAnswers', label: 'جواب قطعی', hint: 'قیمت/موجودی/ارسال از DB بدون LLM' },
  { key: 'semanticCache', label: 'کش معنایی', hint: 'سؤال‌های واقعاً شبیه، متن از کش' },
]

function fmtAudit(a: AceAuditEntry): string {
  const f = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))
  return `${f(a.from)} ← ${f(a.to)}`
}

function EngineTab() {
  const { data, isLoading } = useAceSettings()
  const update = useUpdateAceSettings()
  const revert = useEmergencyRevert()
  const undo = useUndoEmergencyRevert()
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addStore, setAddStore] = useState<string>()
  const [addMode, setAddMode] = useState<EngineMode>('lean')
  const stores = useAceStoreSearch(q)

  if (isLoading || !data) return <Card loading />

  const run = (p: Promise<unknown>, ok: string) =>
    p.then(() => message.success(ok)).catch(() => message.error('ذخیره نشد'))

  const canUndo = data.audit.some((a) => a.field === 'emergencyRevert')

  const confirmEngine = (mode: EngineMode) => {
    if (mode === data.engineMode) return
    const apply = () => run(update.mutateAsync({ engineMode: mode }), 'موتور پیش‌فرض عوض شد')
    if (mode === 'lean') {
      Modal.confirm({
        title: 'تغییر موتور پیش‌فرض به «بهینه»',
        content: 'همه‌ی گفتگوهای جدید با موتور بهینه جواب داده می‌شوند. گفتگوهای در جریان تا آخر روی موتور فعلی‌شان می‌مانند.',
        okText: 'تأیید',
        cancelText: 'انصراف',
        onOk: apply,
      })
    } else apply()
  }

  const overrideCols: ColumnsType<(typeof data.overrides)[number]> = [
    { title: 'فروشگاه', render: (_, r) => (r.store ? `${r.store.name} (${r.store.slug})` : r.storeId) },
    { title: 'موتور', dataIndex: 'mode', render: (m: EngineMode) => <Tag color={m === 'lean' ? 'blue' : 'green'}>{ENGINE_LABEL[m]}</Tag> },
    {
      title: '',
      render: (_, r) => (
        <Button size="small" danger onClick={() => run(update.mutateAsync({ storeOverride: { storeId: r.storeId, mode: null } }), 'استثنا حذف شد')}>
          حذف
        </Button>
      ),
    },
  ]

  const auditCols: ColumnsType<AceAuditEntry> = [
    { title: 'زمان', dataIndex: 'at', render: (v: string) => new Date(v).toLocaleString('fa-IR') },
    { title: 'ادمین', dataIndex: 'adminId', render: (v: string | null) => v ?? '—' },
    { title: 'تنظیم', dataIndex: 'field' },
    { title: 'تغییر', render: (_, a) => <Text style={{ direction: 'ltr', display: 'inline-block' }}>{fmtAudit(a)}</Text> },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        type={data.engineMode === 'lean' ? 'info' : 'success'}
        showIcon
        message={`موتور پیش‌فرض: ${ENGINE_LABEL[data.engineMode]}`}
        description={
          <span>
            {data.overrides.length} فروشگاه استثنا
            {data.lastChange ? ` — آخرین تغییر: ${new Date(data.lastChange.at).toLocaleString('fa-IR')} (${data.lastChange.adminId ?? '—'})` : ''}
          </span>
        }
      />

      <Card title="موتور پیش‌فرض">
        <Space wrap>
          <Radio.Group value={data.engineMode} onChange={(e) => confirmEngine(e.target.value)} optionType="button" buttonStyle="solid">
            <Radio.Button value="stable">پایدار — بات فعلی</Radio.Button>
            <Radio.Button value="lean">بهینه — کم‌هزینه</Radio.Button>
          </Radio.Group>
          <Popconfirm
            title="برگرداندن فوری به پایدار؟"
            description="موتور پیش‌فرض پایدار و همه‌ی استثناها پاک می‌شود؛ همه‌ی گفتگوها از پیام بعدی پایدار می‌شوند."
            okText="بله، برگردان"
            cancelText="انصراف"
            okButtonProps={{ danger: true }}
            onConfirm={() => run(revert.mutateAsync(), 'همه‌چیز روی پایدار است')}
          >
            <Button danger type="primary">برگرداندن فوری به پایدار</Button>
          </Popconfirm>
          <Button disabled={!canUndo} onClick={() => run(undo.mutateAsync(), 'برگرداندن فوری لغو شد')}>
            لغو آخرین برگرداندن
          </Button>
        </Space>
      </Card>

      <Card title="استثنای فروشگاه‌ها" extra={<Button onClick={() => setAddOpen(true)}>افزودن فروشگاه</Button>}>
        <Table rowKey="storeId" size="small" pagination={false} columns={overrideCols} dataSource={data.overrides} locale={{ emptyText: 'استثنایی نیست' }} />
      </Card>
      <Modal
        open={addOpen}
        title="افزودن استثنا"
        okText="ذخیره"
        cancelText="انصراف"
        okButtonProps={{ disabled: !addStore }}
        onCancel={() => setAddOpen(false)}
        onOk={() =>
          addStore &&
          run(update.mutateAsync({ storeOverride: { storeId: addStore, mode: addMode } }), 'استثنا ثبت شد').then(() => {
            setAddOpen(false)
            setAddStore(undefined)
          })
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            showSearch
            filterOption={false}
            placeholder="جست‌وجوی نام یا slug"
            style={{ width: '100%' }}
            onSearch={setQ}
            value={addStore}
            onChange={setAddStore}
            options={(stores.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.slug})` }))}
          />
          <Radio.Group value={addMode} onChange={(e) => setAddMode(e.target.value)}>
            <Radio value="lean">بهینه</Radio>
            <Radio value="stable">پایدار</Radio>
          </Radio.Group>
        </Space>
      </Modal>

      <Card title="کلید لایه‌ها">
        <Descriptions column={1} bordered size="small">
          {LAYERS.map((l) => (
            <Descriptions.Item key={l.key} label={l.label}>
              <Space wrap>
                <Select<LayerMode>
                  style={{ width: 110 }}
                  value={data.layers[l.key] ?? 'off'}
                  options={[{ value: 'off', label: 'off' }, { value: 'shadow', label: 'shadow' }, { value: 'on', label: 'on' }]}
                  onChange={(v) => run(update.mutateAsync({ layers: { [l.key]: v } }), 'ذخیره شد')}
                />
                <Text type="secondary">{l.hint}</Text>
                {!l.both && <Tag>فقط در موتور بهینه اثر دارد</Tag>}
              </Space>
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      <Card title="تاریخچه‌ی تغییرات تنظیمات">
        <Table rowKey={(a) => a.at + a.field} size="small" columns={auditCols} dataSource={data.audit} pagination={{ pageSize: 10 }} />
      </Card>
    </Space>
  )
}

function ChangelogTab() {
  const { data, isLoading } = useBotChangelog()
  const cols: ColumnsType<BotChangelogEntry> = [
    { title: 'تاریخ', dataIndex: 'date' },
    { title: 'آیتم', dataIndex: 'item' },
    { title: 'چه عوض شد', dataIndex: 'change' },
    { title: 'اثر روی جواب', dataIndex: 'answerImpact' },
    { title: 'کلید', dataIndex: 'layerKey', render: (v: string | null) => (v ? <Tag>{v}</Tag> : '—') },
    { title: 'راه برگشت', dataIndex: 'rollback' },
  ]
  return <Table rowKey={(r) => r.item + r.date} loading={isLoading} columns={cols} dataSource={data ?? []} pagination={false} />
}

export function AiCostPage() {
  return (
    <div>
      <Title level={3}>موتور بات</Title>
      <Tabs
        items={[
          { key: 'engine', label: 'موتور', children: <EngineTab /> },
          { key: 'compare', label: 'مقایسه', children: <CompareTab /> },
          { key: 'cost', label: 'هزینه', children: <CostTab /> },
          { key: 'changelog', label: 'دفتر تغییرات', children: <ChangelogTab /> },
        ]}
      />
    </div>
  )
}
