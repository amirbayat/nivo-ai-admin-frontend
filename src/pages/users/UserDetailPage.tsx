import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Tag, Table, Spin, Alert, Button, Space, Select, Popconfirm, message } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { WalletTransaction, UserDetailPayment, UserDailyUsageRow, UserCreativeGeneration, AnalyticsUserTypeUsage, UserDetailMessage } from '@/types/api'
import { useAdminUserDetail, useRefundPayg, usePlans, useChangeUserPlan } from '@/queries/admin.queries'
import { useCreditConfig } from '@/queries/credit-config.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

// docs/PRD-discovery-and-credits.md — نمایش مصرف در پنل ادمین بر اساس نیوو (نه تومان خام)،
// چون کاربر نهایی دیگه تومان نمی‌بینه؛ تومان فقط به‌عنوان جزئیات کوچک کنار نیوو می‌مونه
function creditsLabel(amountToman: number, tomanPerCredit: number): string {
  const credits = Math.round(amountToman / tomanPerCredit)
  return `${credits.toLocaleString('fa-IR')} نیوو (${toman(amountToman)} ت)`
}

function getWalletColumns(tomanPerCredit: number): ColumnsType<WalletTransaction> {
  return [
    {
      title: 'زمان',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      render: (v: WalletTransaction['type']) => (
        <Tag color={v === 'CREDIT' ? 'green' : 'red'}>{v === 'CREDIT' ? 'واریز' : 'برداشت'}</Tag>
      ),
    },
    {
      title: 'مبلغ',
      dataIndex: 'amountToman',
      key: 'amountToman',
      render: (v: number) => creditsLabel(v, tomanPerCredit),
    },
    {
      title: 'هزینه‌ی واقعی OpenRouter ($)',
      key: 'openrouterRealCostUsdMicros',
      render: (_, r) =>
        r.message?.openrouterRealCostUsdMicros == null
          ? '—'
          : `$${(r.message.openrouterRealCostUsdMicros / 1_000_000).toFixed(4)}`,
    },
    {
      title: 'نرخ دلار آن لحظه',
      key: 'exchangeRate',
      render: (_, r) =>
        r.message && r.message.costUsdMicros > 0
          ? `${Math.round(r.message.costToman / (r.message.costUsdMicros / 1_000_000)).toLocaleString('fa-IR')} ت`
          : '—',
    },
    { title: 'توضیح', dataIndex: 'description', key: 'description' },
  ]
}

function getPaymentColumns(tomanPerCredit: number): ColumnsType<UserDetailPayment> {
  return [
    {
      title: 'زمان',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: 'نوع',
      dataIndex: 'kind',
      key: 'kind',
      render: (v: UserDetailPayment['kind']) => (
        <Tag color={v === 'WALLET_TOPUP' ? 'magenta' : 'blue'}>{v === 'WALLET_TOPUP' ? 'شارژ کیف‌پول' : 'خرید اشتراک'}</Tag>
      ),
    },
    { title: 'پلن', key: 'plan', render: (_, r) => r.plan?.name ?? '—' },
    { title: 'مبلغ', dataIndex: 'amount', key: 'amount', render: (v: number) => creditsLabel(v, tomanPerCredit) },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (v: UserDetailPayment['status']) => {
        const color = v === 'COMPLETED' ? 'green' : v === 'PENDING' ? 'orange' : 'red'
        const label = { COMPLETED: 'موفق', PENDING: 'در انتظار', FAILED: 'ناموفق', REFUNDED: 'برگشت‌خورده' }[v]
        return <Tag color={color}>{label}</Tag>
      },
    },
  ]
}

// docs/PRD-admin-credit-reports.md فاز ۷ — قبلاً این صفحه هیچ ردی از مصرف دیسکاوری/کریتیو
// (تولید عکس/متن با نیوو) کاربر را نشان نمی‌داد، فقط چت و کیف‌پول
function getCreativeGenerationColumns(tomanPerCredit: number): ColumnsType<UserCreativeGeneration> {
  return [
    {
      title: 'زمان',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    { title: 'سبک', key: 'prompt', render: (_, r) => r.prompt.title },
    {
      title: 'نوع',
      dataIndex: 'outputType',
      key: 'outputType',
      render: (v: UserCreativeGeneration['outputType']) => <Tag>{v === 'IMAGE' ? 'عکس' : 'متن'}</Tag>,
    },
    { title: 'نیوو', dataIndex: 'creditCost', key: 'creditCost', render: (v: number) => v.toLocaleString('fa-IR') },
    { title: 'هزینه‌ی واقعی AI', dataIndex: 'costToman', key: 'costToman', render: (v: number) => creditsLabel(v, tomanPerCredit) },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (v: UserCreativeGeneration['status'], r) => (
        <Tag color={v === 'SUCCEEDED' ? 'green' : 'red'} title={r.failureReason ?? undefined}>
          {v === 'SUCCEEDED' ? 'موفق' : 'ناموفق'}
        </Tag>
      ),
    },
  ]
}

// جزئیات per-message هزینه — هزینه‌ی واقعی گزارش‌شده توسط OpenRouter (openrouterRealCost*،
// فقط وقتی provider=OPENROUTER بوده پر می‌شود)، نرخ دلاری که در همون لحظه اعمال شده
// (از costToman/costUsdMicros استخراج می‌شود، چون هر دو با یک نرخ محاسبه شده‌اند)، هزینه‌ی
// ریالی واقعاً از کیف‌پول کسرشده، و معادل نیوویش
function getMessageColumns(tomanPerCredit: number): ColumnsType<UserDetailMessage> {
  return [
    {
      title: 'زمان',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    { title: 'مدل', dataIndex: 'model', key: 'model', render: (v: string | null) => v ?? '—' },
    {
      title: 'هزینه‌ی واقعی OpenRouter ($)',
      dataIndex: 'openrouterRealCostUsdMicros',
      key: 'openrouterRealCostUsdMicros',
      render: (v: number | null) => (v == null ? '—' : `$${(v / 1_000_000).toFixed(4)}`),
    },
    {
      title: 'نرخ دلار آن لحظه',
      key: 'exchangeRate',
      render: (_, r) =>
        r.costUsdMicros > 0
          ? `${Math.round(r.costToman / (r.costUsdMicros / 1_000_000)).toLocaleString('fa-IR')} ت`
          : '—',
    },
    { title: 'هزینه‌ی ریالی', dataIndex: 'costToman', key: 'costToman', render: (v: number) => `${toman(v)} ت` },
    {
      title: 'نیوو',
      key: 'credits',
      render: (_, r) => Math.round(r.costToman / tomanPerCredit).toLocaleString('fa-IR'),
    },
  ]
}

function getUsageColumns(tomanPerCredit: number): ColumnsType<UserDailyUsageRow> {
  return [
    { title: 'تاریخ', dataIndex: 'date', key: 'date', render: (v: string) => new Date(v).toLocaleDateString('fa-IR') },
    { title: 'درخواست‌ها', dataIndex: 'requestsCount', key: 'requestsCount' },
    { title: 'هزینه', dataIndex: 'costToman', key: 'costToman', render: (v: number) => creditsLabel(v, tomanPerCredit) },
    {
      title: 'هزینه ($)',
      dataIndex: 'costUsdMicros',
      key: 'costUsdMicros',
      render: (v: number) => `$${(v / 1_000_000).toFixed(3)}`,
    },
  ]
}

function TypeUsageCard({ title, usage, tomanPerCredit }: { title: string; usage: AnalyticsUserTypeUsage; tomanPerCredit: number }) {
  return (
    <Card title={title}>
      <Row gutter={16}>
        <Col span={8}><Statistic title="پیام" value={usage.messages} /></Col>
        <Col span={8}>
          <Statistic title="توکن (ورودی/خروجی)" value={`${usage.tokensInput} / ${usage.tokensOutput}`} />
        </Col>
        <Col span={8}><Statistic title="هزینه" value={creditsLabel(usage.costToman, tomanPerCredit)} /></Col>
      </Row>
      <Text type="secondary" style={{ fontSize: 12 }}>
        پرمصرف‌ترین مدل: {usage.mostUsedModel ?? '—'}
      </Text>
    </Card>
  )
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useAdminUserDetail(id ?? '')
  const { data: creditConfig } = useCreditConfig()
  const { data: plans } = usePlans()
  const tomanPerCredit = creditConfig?.tomanPerCredit ?? 1
  const refundPayg = useRefundPayg()
  const changeUserPlan = useChangeUserPlan()
  const [messageApi, contextHolder] = message.useMessage()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  if (isLoading) return <Spin />
  if (isError || !data) return <Alert type="error" message={fa.common.error} />

  const { user, walletBalanceToman, walletTransactions, payments, dailyUsage, creativeGenerations, messages, textUsage, imageUsage } = data
  const isPayg = Boolean(user.subscription?.plan.isPayAsYouGo)

  // بدون پرداخت واقعی، وصل‌کردن دستی subscription کاربر به یک پلن — مخصوصاً برای پلن‌های
  // PAYG که معمولاً فقط بعد از یک شارژ کیف‌پول موفق خودکار وصل می‌شوند (payments.service.ts)
  function handleChangePlan() {
    if (!id || !selectedPlanId) return
    changeUserPlan.mutate(
      { userId: id, planId: selectedPlanId },
      {
        onSuccess: () => void messageApi.success('پلن کاربر تغییر کرد'),
        onError: () => void messageApi.error(fa.common.error),
      },
    )
  }

  function handleRefund() {
    if (!id) return
    refundPayg.mutate(id, {
      onSuccess: (res) => {
        void messageApi.success(
          res.refundedAmountToman > 0
            ? `${res.refundedAmountToman.toLocaleString('fa-IR')} تومان از کیف‌پول صفر شد — این مبلغ رو دستی به کاربر برگردون. اکانت از Pay-as-you-go خارج شد.`
            : 'موجودی کیف‌پول صفر بود؛ اکانت از Pay-as-you-go خارج شد.',
          8,
        )
      },
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/admin/users')}>
          بازگشت به لیست کاربران
        </Button>

        <Space>
          <Select
            style={{ width: 240 }}
            placeholder="تغییر پلن کاربر..."
            value={selectedPlanId}
            onChange={setSelectedPlanId}
            options={(plans ?? []).map(p => ({
              value: p.id,
              label: p.isPayAsYouGo ? `${p.name} (PAYG)` : p.name,
            }))}
          />
          <Button
            type="primary"
            disabled={!selectedPlanId}
            loading={changeUserPlan.isPending}
            onClick={handleChangePlan}
          >
            اعمال پلن
          </Button>
        </Space>

        {isPayg && (
          <Popconfirm
            title="بازگشت وجه و خروج از Pay-as-you-go"
            description={
              <span>
                موجودی کیف‌پول ({toman(walletBalanceToman)} تومان) صفر می‌شود و اکانت به پلن رایگان برمی‌گردد.
                <br />
                خودِ واریز پول به کاربر رو باید دستی انجام بدی — این فقط دفترداری داخل سیستمه.
              </span>
            }
            okText="تأیید و صفر کردن"
            cancelText="انصراف"
            onConfirm={handleRefund}
          >
            <Button danger loading={refundPayg.isPending}>
              بازگشت وجه و خروج از PAYG
            </Button>
          </Popconfirm>
        )}
      </Space>

      <Title level={4} style={{ marginBottom: 4 }}>
        {user.name ?? 'کاربر بی‌نام'} <Text dir="ltr" type="secondary" style={{ fontSize: 15 }}>{user.phone}</Text>
      </Title>
      <Text type="secondary">عضویت از {new Date(user.createdAt).toLocaleDateString('fa-IR')} — {user.lifetimeMessageCount.toLocaleString('fa-IR')} پیام در کل عمر حساب</Text>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="موجودی کیف‌پول" value={creditsLabel(walletBalanceToman, tomanPerCredit)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="پلن فعلی"
              value={user.subscription?.plan.name ?? 'رایگان'}
              suffix={user.subscription?.plan.isPayAsYouGo ? <Tag color="magenta">PAYG</Tag> : undefined}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="وضعیت حساب" value={user.isActive ? 'فعال' : 'غیرفعال'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="اعتبار اشتراک تا"
              value={user.subscription ? new Date(user.subscription.periodEnd).toLocaleDateString('fa-IR') : '—'}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="تاریخچه‌ی تراکنش‌های کیف‌پول">
        <Table<WalletTransaction>
          rowKey="id"
          dataSource={walletTransactions}
          columns={getWalletColumns(tomanPerCredit)}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="تاریخچه‌ی پرداخت‌ها">
        <Table<UserDetailPayment>
          rowKey="id"
          dataSource={payments}
          columns={getPaymentColumns(tomanPerCredit)}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="مصرف روزانه (۳۰ روز اخیر)">
        <Table<UserDailyUsageRow>
          rowKey="id"
          dataSource={dailyUsage}
          columns={getUsageColumns(tomanPerCredit)}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}><TypeUsageCard title="مصرف مدل‌های تولید متن (۳۰ روز اخیر)" usage={textUsage} tomanPerCredit={tomanPerCredit} /></Col>
        <Col span={12}><TypeUsageCard title="مصرف مدل‌های تولید عکس (۳۰ روز اخیر)" usage={imageUsage} tomanPerCredit={tomanPerCredit} /></Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="جزئیات هزینه‌ی پیام‌ها (۵۰ پیام اخیر)">
        <Table<UserDetailMessage>
          rowKey="id"
          dataSource={messages}
          columns={getMessageColumns(tomanPerCredit)}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="تاریخچه‌ی تولید محتوا (دیسکاوری/کریتیو)">
        <Table<UserCreativeGeneration>
          rowKey="id"
          dataSource={creativeGenerations}
          columns={getCreativeGenerationColumns(tomanPerCredit)}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}
