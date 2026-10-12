import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Card, DatePicker, Input, Row, Col, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAdminOrderPaymentMethodStats, useAdminOrders } from '@/queries/orders.queries'
import type { AdminOrderListItem, AdminOrderPaymentMethod, AdminOrderStatus } from '@/types/api'
import { fa } from '@/locales/fa'

const { Title } = Typography
const { RangePicker } = DatePicker

const PAYMENT_METHOD_COLOR: Record<AdminOrderPaymentMethod, string> = {
  CARD_TO_CARD: 'blue',
  SNAPPPAY: 'purple',
}

const STATUS_COLOR: Record<AdminOrderStatus, string> = {
  PENDING_PAYMENT: 'default',
  RECEIPT_SUBMITTED: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  SHIPPED: 'blue',
}

// docs/PRD-buyer-payment-method-card-or-snapppay-link.md بخش ۹.۲ — صفحه‌ی سفارش‌های کراس-فروشگاه
// ادمین نیوو: کدام سفارش کارت‌به‌کارت و کدام اسنپ‌پی است + گزارش تجمیعی روش پرداخت
export function OrdersPage() {
  const [page, setPage] = useState(1)
  const [storeId, setStoreId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<AdminOrderPaymentMethod | undefined>(undefined)
  const [status, setStatus] = useState<AdminOrderStatus | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)

  const from = range?.[0]?.format('YYYY-MM-DD')
  const to = range?.[1]?.format('YYYY-MM-DD')

  const { data, isLoading } = useAdminOrders({
    page,
    storeId: storeId || undefined,
    paymentMethod,
    status,
    from,
    to,
  })
  const { data: stats } = useAdminOrderPaymentMethodStats({ from, to })

  const columns: ColumnsType<AdminOrderListItem> = [
    {
      title: fa.orders.store,
      dataIndex: 'storeName',
      width: 180,
    },
    {
      title: fa.orders.amount,
      dataIndex: 'totalAmount',
      width: 130,
      render: (v: number) => `${v.toLocaleString('fa-IR')} ت`,
    },
    {
      title: fa.orders.status,
      dataIndex: 'status',
      width: 110,
      render: (v: AdminOrderStatus) => <Tag color={STATUS_COLOR[v]}>{fa.orders.statusLabels[v] ?? v}</Tag>,
    },
    {
      title: fa.orders.paymentMethod,
      dataIndex: 'paymentMethod',
      width: 130,
      render: (v: AdminOrderPaymentMethod) => <Tag color={PAYMENT_METHOD_COLOR[v]}>{fa.orders.paymentMethodLabels[v] ?? v}</Tag>,
    },
    {
      title: fa.orders.trackingCode,
      dataIndex: 'snapppayTrackingCode',
      width: 140,
      render: (v: string | null) => (v ? <span dir="ltr">{v}</span> : '—'),
    },
    {
      title: fa.orders.recipient,
      key: 'recipient',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.recipientName ?? '—'}</span>
          <span dir="ltr" style={{ fontSize: 12, color: '#94a3b8' }}>
            {r.recipientPhone ?? ''}
          </span>
        </Space>
      ),
    },
    {
      title: fa.orders.date,
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.orders.title}
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic title={fa.orders.summary.cardToCardCount} value={stats?.CARD_TO_CARD.count ?? 0} />
          </Col>
          <Col span={6}>
            <Statistic title={fa.orders.summary.cardToCardAmount} value={stats?.CARD_TO_CARD.totalAmountToman ?? 0} suffix="ت" />
          </Col>
          <Col span={6}>
            <Statistic title={fa.orders.summary.snapppayCount} value={stats?.SNAPPPAY.count ?? 0} />
          </Col>
          <Col span={6}>
            <Statistic title={fa.orders.summary.snapppayAmount} value={stats?.SNAPPPAY.totalAmountToman ?? 0} suffix="ت" />
          </Col>
        </Row>
      </Card>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder={fa.orders.filterStore}
          value={storeId}
          onChange={(e) => {
            setStoreId(e.target.value)
            setPage(1)
          }}
          allowClear
          style={{ width: 220 }}
        />
        <Select
          placeholder={fa.orders.filterPaymentMethod}
          value={paymentMethod}
          onChange={(v) => {
            setPaymentMethod(v)
            setPage(1)
          }}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'CARD_TO_CARD', label: fa.orders.paymentMethodLabels.CARD_TO_CARD },
            { value: 'SNAPPPAY', label: fa.orders.paymentMethodLabels.SNAPPPAY },
          ]}
        />
        <Select
          placeholder={fa.orders.filterStatus}
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          allowClear
          style={{ width: 160 }}
          options={Object.entries(fa.orders.statusLabels).map(([value, label]) => ({ value, label }))}
        />
        <RangePicker
          value={range}
          onChange={(v) => {
            setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
            setPage(1)
          }}
        />
      </Space>

      <Card>
        <Table<AdminOrderListItem>
          rowKey="id"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          scroll={{ x: 1100 }}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: data?.pageSize ?? 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  )
}
