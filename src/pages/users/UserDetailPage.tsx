import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Tag, Table, Spin, Alert, Button, Space, Popconfirm, message } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { WalletTransaction, UserDetailPayment, UserDailyUsageRow } from '@/types/api'
import { useAdminUserDetail, useRefundPayg } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

const walletColumns: ColumnsType<WalletTransaction> = [
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
    title: 'مبلغ (تومان)',
    dataIndex: 'amountToman',
    key: 'amountToman',
    render: (v: number) => toman(v),
  },
  { title: 'توضیح', dataIndex: 'description', key: 'description' },
]

const paymentColumns: ColumnsType<UserDetailPayment> = [
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
  { title: 'مبلغ (تومان)', dataIndex: 'amount', key: 'amount', render: (v: number) => toman(v) },
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

const usageColumns: ColumnsType<UserDailyUsageRow> = [
  { title: 'تاریخ', dataIndex: 'date', key: 'date', render: (v: string) => new Date(v).toLocaleDateString('fa-IR') },
  { title: 'درخواست‌ها', dataIndex: 'requestsCount', key: 'requestsCount' },
  { title: 'هزینه (تومان)', dataIndex: 'costToman', key: 'costToman', render: (v: number) => toman(v) },
  {
    title: 'هزینه ($)',
    dataIndex: 'costUsdMicros',
    key: 'costUsdMicros',
    render: (v: number) => `$${(v / 1_000_000).toFixed(3)}`,
  },
]

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useAdminUserDetail(id ?? '')
  const refundPayg = useRefundPayg()
  const [messageApi, contextHolder] = message.useMessage()

  if (isLoading) return <Spin />
  if (isError || !data) return <Alert type="error" message={fa.common.error} />

  const { user, walletBalanceToman, walletTransactions, payments, dailyUsage } = data
  const isPayg = Boolean(user.subscription?.plan.isPayAsYouGo)

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
            <Statistic title="موجودی کیف‌پول" value={toman(walletBalanceToman)} suffix="تومان" />
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
          columns={walletColumns}
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
          columns={paymentColumns}
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
          columns={usageColumns}
          pagination={false}
          size="small"
          locale={{ emptyText: fa.common.noData }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}
