import { useState } from 'react'
import {
  Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag, message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { DiscountCode, DiscountSource } from '@/types/api'
import {
  useCreateDiscountCode, useDiscountCodes, useSetDiscountCodeActive,
} from '@/queries/growth.queries'

const SOURCE_LABELS: Record<DiscountSource, { label: string; color: string }> = {
  WELCOME_GIFT: { label: 'هدیه‌ی خوش‌آمد', color: 'cyan' },
  EXPIRY_REMINDER: { label: 'هشدار انقضا', color: 'orange' },
  REFERRAL: { label: 'معرفی دوستان', color: 'purple' },
  MANUAL: { label: 'دستی/کمپین', color: 'green' },
}

const SOURCE_FILTERS = Object.entries(SOURCE_LABELS).map(([value, { label }]) => ({ value, text: label }))

interface CreateFormValues {
  discountPercent: number
  maxUses?: number
  expiresAt?: dayjs.Dayjs
  codeSuffix?: string
}

export function DiscountCodesTab() {
  const [sourceFilter, setSourceFilter] = useState<DiscountSource | undefined>(undefined)
  const { data: codes, isLoading } = useDiscountCodes(sourceFilter)
  const createCode = useCreateDiscountCode()
  const setActive = useSetDiscountCodeActive()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<CreateFormValues>()

  function openCreate() {
    form.resetFields()
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      createCode.mutate(
        {
          discountPercent: values.discountPercent,
          maxUses: values.maxUses,
          expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
          codeSuffix: values.codeSuffix,
        },
        {
          onSuccess: () => { void message.success('کد ساخته شد'); setOpen(false) },
          onError: () => void message.error('ساخته نشد، دوباره امتحان کن'),
        },
      )
    })
  }

  const columns: ColumnsType<DiscountCode> = [
    { title: 'کد', dataIndex: 'code', key: 'code', render: (v: string) => <code>{v}</code> },
    {
      title: 'منبع', dataIndex: 'source', key: 'source',
      filters: SOURCE_FILTERS,
      render: (v: DiscountSource) => <Tag color={SOURCE_LABELS[v].color}>{SOURCE_LABELS[v].label}</Tag>,
    },
    { title: 'درصد', dataIndex: 'discountPercent', key: 'discountPercent', render: (v: number) => `٪${v}` },
    {
      title: 'برای', key: 'issuedTo',
      render: (_, r) => r.issuedToUser ? (r.issuedToUser.name ?? r.issuedToUser.phone) : <Tag>عمومی</Tag>,
    },
    {
      title: 'مصرف', key: 'usage',
      render: (_, r) => `${r.usedCount} / ${r.maxUses}`,
    },
    {
      title: 'انقضا', dataIndex: 'expiresAt', key: 'expiresAt',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('fa-IR') : 'بدون انقضا',
    },
    {
      title: 'وضعیت', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean, r) => (
        <Switch
          size="small"
          checked={v}
          loading={setActive.isPending}
          onChange={(checked) => setActive.mutate({ id: r.id, isActive: checked })}
        />
      ),
    },
    {
      title: 'ساخته‌شده', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="فیلتر بر اساس منبع"
          style={{ width: 220 }}
          options={SOURCE_FILTERS.map((f) => ({ value: f.value, label: f.text }))}
          onChange={(v) => setSourceFilter(v as DiscountSource | undefined)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          ساخت کد کمپینی
        </Button>
      </div>

      <Table<DiscountCode>
        rowKey="id"
        dataSource={codes ?? []}
        columns={columns}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        title="ساخت کد تخفیف کمپینی (عمومی)"
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText="ذخیره"
        cancelText="انصراف"
        confirmLoading={createCode.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="discountPercent" label="درصد تخفیف" rules={[{ required: true }]}>
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxUses" label="حداکثر تعداد مصرف"
            extra="خالی = فقط ۱ بار"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="مثلاً ۵۰۰" />
          </Form.Item>
          <Form.Item name="expiresAt" label="تاریخ انقضا" extra="خالی = بدون انقضا">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="codeSuffix" label="بخش دلخواه کد (اختیاری)"
            extra="مثلاً NOWRUZ — کد نهایی می‌شود NIVO-NOWRUZ. خالی = تصادفی"
          >
            <Input style={{ direction: 'ltr' }} placeholder="NOWRUZ" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
