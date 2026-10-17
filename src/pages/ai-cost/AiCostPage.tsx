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
  useShadowJudgeRun,
  useShadowQueue,
  useShadowReport,
  useShadowReview,
  type ShadowLayerReport,
  type ShadowStratum,
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

const LAYER_TITLE: Record<string, string> = { fastAnswers: 'جواب قطعی', productBrief: 'برگه‌ی محصول', semanticCache: 'کش معنایی' }
const VERDICT_LABEL = { equal: 'برابر', worse: 'بدتر', wrong: 'غلط' } as const

function StrataTable({ rows }: { rows: ShadowStratum[] }) {
  return (
    <Table size="small" rowKey="key" pagination={false} dataSource={rows} columns={[
      { title: 'گروه', dataIndex: 'key' },
      { title: 'نمونه', dataIndex: 'n' },
      { title: 'برابر', dataIndex: 'equal' },
      { title: 'بدتر', dataIndex: 'worse' },
      { title: 'غلط', dataIndex: 'wrong' },
      { title: 'در انتظار', dataIndex: 'pending' },
      { title: 'دروازه', render: (_, r) => <Tag color={r.passes ? 'green' : 'default'}>{r.passes ? 'پاس' : r.reason}</Tag> },
    ]} />
  )
}

function ShadowLayerCard({ r }: { r: ShadowLayerReport }) {
  const title = `${LAYER_TITLE[r.layer] ?? r.layer}`
  return (
    <Card size="small" title={title} extra={<Tag color={r.gate.passes ? 'green' : 'orange'}>{r.gate.passes ? 'دروازه باز' : `بسته: ${r.gate.reason}`}</Tag>}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <Text>نمونه: {r.total.n}</Text>
          <Text>برابر: {r.total.equal}</Text>
          <Text>بدتر: {r.total.worse}</Text>
          <Text type={r.total.wrong ? 'danger' : undefined}>غلط: {r.total.wrong}</Text>
          <Text type="secondary">در انتظار داوری: {r.total.pending}</Text>
          <Text type="secondary">بازبینی انسانی نیت‌های حساس: {r.humanSensitive.reviewed}/۵۰</Text>
          <Text type="secondary">اختلاف judge و انسان: {r.judgeHumanDisagree}</Text>
        </Space>
        {r.total.n > 0 && (
          <Tabs size="small" items={[
            { key: 'i', label: 'به تفکیک نیت', children: <StrataTable rows={r.byIntent} /> },
            { key: 't', label: 'به تفکیک ویژگی', children: <StrataTable rows={r.byTag} /> },
            { key: 'c', label: 'به تفکیک دسته', children: <StrataTable rows={r.byCategory} /> },
          ]} />
        )}
      </Space>
    </Card>
  )
}

function ShadowTab() {
  const report = useShadowReport()
  const queue = useShadowQueue()
  const review = useShadowReview()
  const run = useShadowJudgeRun()
  const [msg, ctx] = message.useMessage()
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {ctx}
      <Alert type="info" showIcon message="در حالت shadow، لایه جواب کاندید می‌سازد ولی جواب واقعی از مدل می‌رود. هر نمونه را judge (مدل سبک) و شما داوری می‌کنید. دروازه‌ها فقط پیشنهادند؛ روشن‌کردن با تصمیم شماست." />
      <Space>
        <Text>کل نمونه‌ها: {report.data?.total ?? 0} — در انتظار judge: {report.data?.pendingJudge ?? 0}</Text>
        <Button loading={run.isPending} onClick={() => run.mutate(undefined, { onSuccess: (r) => void msg.success(`${r.judged} نمونه داوری شد${r.skippedByCap ? ' (به سقف روزانه رسید)' : ''}`) })}>اجرای judge</Button>
      </Space>
      {(report.data?.layers ?? []).filter((l) => l.total.n > 0).map((l, i) => <ShadowLayerCard key={`${l.layer}${i}`} r={l} />)}
      {report.data && report.data.layers.every((l) => l.total.n === 0) && <Text type="secondary">هنوز نمونه‌ای نیست. fastAnswers را روی shadow بگذارید و فروشگاهی را روی «بهینه» ببرید.</Text>}
      <Card size="small" title="صف بازبینی انسانی (غلط/بدتر اول)">
        <Table size="small" rowKey="id" loading={queue.isLoading} dataSource={queue.data ?? []} pagination={{ pageSize: 10 }} columns={[
          { title: 'پیام مشتری', dataIndex: 'customerMessage', width: 160 },
          { title: 'جواب واقعی (A)', dataIndex: 'realText' },
          { title: 'کاندید (B)', dataIndex: 'candidateText' },
          { title: 'judge', render: (_, r) => (r.judge ? <Tag color={r.judge.verdict === 'equal' ? 'green' : r.judge.verdict === 'worse' ? 'orange' : 'red'} title={r.judge.reason}>{VERDICT_LABEL[r.judge.verdict]}</Tag> : '—') },
          { title: 'حکم شما', render: (_, r) => (
            <Space>
              {(['equal', 'worse', 'wrong'] as const).map((v) => (
                <Button key={v} size="small" danger={v === 'wrong'} onClick={() => review.mutate({ id: r.id, verdict: v })}>{VERDICT_LABEL[v]}</Button>
              ))}
            </Space>
          ) },
        ]} />
      </Card>
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
  { key: 'productBrief', label: 'برگه‌ی محصول', hint: 'توضیح محصول به‌جای بریده‌شدن، به‌صورت برگه + فهرست بخش‌ها؛ فقط مصرف (ساخت برگه همیشه است). shadow هنوز مصرف نمی‌شود' },
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
          { key: 'shadow', label: 'shadow', children: <ShadowTab /> },
          { key: 'changelog', label: 'دفتر تغییرات', children: <ChangelogTab /> },
        ]}
      />
    </div>
  )
}
