import { useState } from 'react'
import {
  Table, Input, Button, Tag, Space, Typography, Popconfirm,
  message, Modal, Select, Form, Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AdminUser } from '@/types/api'
import {
  useAdminUsers, useUpdateUser, useSetUserLimit,
  useRemoveUserLimit, useChangeUserPlan, usePlans,
} from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography
const { Search } = Input

const CATEGORY_COLOR: Record<AdminUser['category'], string> = {
  heavy: 'red', moderate: 'orange', light: 'blue', inactive: 'default',
}
const CATEGORY_LABEL: Record<AdminUser['category'], string> = {
  heavy: 'پرمصرف', moderate: 'متوسط', light: 'کم‌مصرف', inactive: 'غیرفعال',
}
const LIMIT_OPTIONS = [
  { label: '۱ ساعت', value: '1h' },
  { label: '۳ ساعت', value: '3h' },
  { label: '۶ ساعت', value: '6h' },
  { label: 'تمام روز', value: 'daily' },
]

function SparkBar({ actual, expected, charged }: { actual: number; expected: number; charged: number }) {
  const W = 80, H = 32
  if (!charged && !actual) return <span style={{ color: '#555', fontSize: 11 }}>—</span>

  const max = Math.max(actual, expected, 1)
  const expPct = Math.round((expected / max) * 100)
  const actPct = Math.round((actual / max) * 100)

  return (
    <Tooltip title={`مصرف: ${Math.round(actual / 10).toLocaleString('fa-IR')} ت / انتظار: ${Math.round(expected / 10).toLocaleString('fa-IR')} ت`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
        {/* expected bar (gray) */}
        <rect x={0} y={4} width={expPct * W / 100} height={10} rx={3} fill="#334155" />
        {/* actual bar */}
        <rect x={0} y={18} width={actPct * W / 100} height={10} rx={3}
          fill={actual > expected * 1.4 ? '#ef4444' : actual > expected * 0.8 ? '#f59e0b' : '#10b981'} />
        <text x={W - 1} y={12} fontSize={8} fill="#64748b" textAnchor="end">انتظار</text>
        <text x={W - 1} y={26} fontSize={8} fill="#94a3b8" textAnchor="end">واقعی</text>
      </svg>
    </Tooltip>
  )
}

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const [limitModal, setLimitModal] = useState<{ open: boolean; userId: string; phone: string }>({ open: false, userId: '', phone: '' })
  const [planModal, setPlanModal] = useState<{ open: boolean; userId: string; phone: string }>({ open: false, userId: '', phone: '' })
  const [limitForm] = Form.useForm()
  const [planForm] = Form.useForm()

  const { data, isLoading } = useAdminUsers(page, search)
  const { data: plans } = usePlans()
  const updateUser = useUpdateUser()
  const setLimit = useSetUserLimit()
  const removeLimit = useRemoveUserLimit()
  const changePlan = useChangeUserPlan()

  function handleSearch(value: string) { setSearch(value); setPage(1) }

  function handleToggleActive(user: AdminUser) {
    updateUser.mutate(
      { userId: user.id, data: { isActive: !user.isActive } },
      { onSuccess: () => void messageApi.success(fa.users.updated), onError: () => void messageApi.error(fa.common.error) },
    )
  }

  function handleSetLimit() {
    limitForm.validateFields().then(values => {
      setLimit.mutate(
        { userId: limitModal.userId, type: values.type, reason: values.reason },
        {
          onSuccess: (res) => {
            messageApi.success(`محدودیت تا ${new Date(res.expiresAt).toLocaleTimeString('fa-IR')} اعمال شد`)
            setLimitModal({ open: false, userId: '', phone: '' })
            limitForm.resetFields()
          },
          onError: () => void messageApi.error(fa.common.error),
        },
      )
    })
  }

  function handleChangePlan() {
    planForm.validateFields().then(values => {
      changePlan.mutate(
        { userId: planModal.userId, planId: values.planId },
        {
          onSuccess: () => {
            messageApi.success('پلن کاربر تغییر کرد')
            setPlanModal({ open: false, userId: '', phone: '' })
            planForm.resetFields()
          },
          onError: () => void messageApi.error(fa.common.error),
        },
      )
    })
  }

  const columns: ColumnsType<AdminUser> = [
    {
      title: fa.users.phone,
      dataIndex: 'phone',
      render: (v: string) => <span dir="ltr">{v}</span>,
      width: 130,
    },
    {
      title: fa.users.name,
      dataIndex: 'name',
      render: (v: string | null) => v ?? '—',
      width: 100,
    },
    {
      title: 'پلن',
      key: 'plan',
      width: 100,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => { setPlanModal({ open: true, userId: r.id, phone: r.phone }) }}>
          {r.subscription?.plan.name ?? 'رایگان'}
        </Button>
      ),
    },
    {
      title: 'دسته‌بندی',
      key: 'category',
      width: 90,
      render: (_, r) => <Tag color={CATEGORY_COLOR[r.category]}>{CATEGORY_LABEL[r.category]}</Tag>,
    },
    {
      title: 'شارژ ماه (ت)',
      key: 'charged',
      width: 100,
      render: (_, r) => <span style={{ fontSize: 12 }}>{Math.round(r.chargedThisMonth / 10).toLocaleString('fa-IR')}</span>,
    },
    {
      title: 'مصرف AI (ت)',
      key: 'aiCost',
      width: 100,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: r.aiCostThisMonth > r.expectedByNow * 1.4 ? '#ef4444' : '#e2e8f0' }}>
          {Math.round(r.aiCostThisMonth / 10).toLocaleString('fa-IR')}
        </span>
      ),
    },
    {
      title: 'مصرف AI ($)',
      key: 'aiCostUsd',
      width: 90,
      render: (_, r) => (
        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
          ${r.aiCostUsdThisMonth.toFixed(3)}
        </span>
      ),
    },
    {
      title: 'انتظار تا الان',
      key: 'expected',
      width: 110,
      render: (_, r) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(r.expectedByNow / 10).toLocaleString('fa-IR')}</span>,
    },
    {
      title: 'نمودار مصرف',
      key: 'spark',
      width: 100,
      render: (_, r) => <SparkBar actual={r.aiCostThisMonth} expected={r.expectedByNow} charged={r.chargedThisMonth} />,
    },
    {
      title: fa.users.status,
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? fa.users.active : fa.users.inactive}</Tag>,
    },
    {
      title: fa.common.actions,
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space wrap>
          <Button size="small" type={record.isActive ? 'default' : 'primary'} onClick={() => handleToggleActive(record)}>
            {record.isActive ? fa.users.disable : fa.users.enable}
          </Button>
          <Button
            size="small"
            danger
            onClick={() => { setLimitModal({ open: true, userId: record.id, phone: record.phone }); limitForm.resetFields() }}
          >
            محدود کردن
          </Button>
          <Popconfirm title="محدودیت برداشته شود؟" onConfirm={() => removeLimit.mutate(record.id)}>
            <Button size="small">رفع محدودیت</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 16 }}>{fa.users.title}</Title>

      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder={fa.users.search}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          allowClear
          style={{ maxWidth: 320 }}
          enterButton
        />
      </div>

      <Table<AdminUser>
        rowKey="id"
        dataSource={data?.users ?? []}
        columns={columns}
        loading={isLoading}
        scroll={{ x: 1000 }}
        locale={{ emptyText: fa.common.noData }}
        pagination={{ current: page, pageSize: 10, total: data?.total ?? 0, onChange: setPage, showSizeChanger: false }}
      />

      {/* limit modal */}
      <Modal
        title={`محدود کردن کاربر: ${limitModal.phone}`}
        open={limitModal.open}
        onOk={handleSetLimit}
        onCancel={() => setLimitModal({ open: false, userId: '', phone: '' })}
        confirmLoading={setLimit.isPending}
        okText="اعمال محدودیت"
        cancelText="انصراف"
      >
        <Form form={limitForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="مدت محدودیت" rules={[{ required: true, message: 'انتخاب کنید' }]}>
            <Select options={LIMIT_OPTIONS} placeholder="انتخاب کنید" />
          </Form.Item>
          <Form.Item name="reason" label="دلیل (نمایش به کاربر)">
            <Input placeholder="مثلاً: مصرف غیرعادی تشخیص داده شد" />
          </Form.Item>
        </Form>
      </Modal>

      {/* change plan modal */}
      <Modal
        title={`تغییر پلن: ${planModal.phone}`}
        open={planModal.open}
        onOk={handleChangePlan}
        onCancel={() => setPlanModal({ open: false, userId: '', phone: '' })}
        confirmLoading={changePlan.isPending}
        okText="تغییر پلن"
        cancelText="انصراف"
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="planId" label="پلن جدید" rules={[{ required: true, message: 'انتخاب کنید' }]}>
            <Select
              options={plans?.map(p => ({ label: `${p.name} — ${Math.round(p.priceMonthly / 10).toLocaleString('fa-IR')} تومان`, value: p.id }))}
              placeholder="انتخاب پلن"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
