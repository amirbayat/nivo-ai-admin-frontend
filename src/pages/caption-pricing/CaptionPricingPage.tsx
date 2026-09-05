import { useState } from 'react'
import { Table, Button, Modal, Form, InputNumber, Space, Popconfirm, Typography, Card, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CaptionPricingTier } from '@/types/api'
import {
  useCaptionPricingTiers,
  useCreateCaptionPricingTier,
  useUpdateCaptionPricingTier,
  useDeleteCaptionPricingTier,
} from '@/queries/caption-pricing-tiers.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

interface TierFormValues {
  maxDurationSec: number | null
  creditCost: number
  sortOrder: number
}

// docs/PRD-video-auto-captions.md §۱۴.۳/§۱۸ — دقیقاً هم‌الگوی PricingTiersPage.tsx، فقط پله‌ها
// بر اساس طول ویدیو (ثانیه) هستند، نه هزینه‌ی واقعی تومانی
export function CaptionPricingPage() {
  const [form] = Form.useForm<TierFormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CaptionPricingTier | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const { data: tiers, isLoading } = useCaptionPricingTiers()
  const createTier = useCreateCaptionPricingTier()
  const updateTier = useUpdateCaptionPricingTier()
  const deleteTier = useDeleteCaptionPricingTier()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ maxDurationSec: null, creditCost: 1, sortOrder: (tiers?.length ?? 0) + 1 })
    setOpen(true)
  }

  function openEdit(tier: CaptionPricingTier) {
    setEditing(tier)
    form.setFieldsValue({
      maxDurationSec: tier.maxDurationSec,
      creditCost: tier.creditCost,
      sortOrder: tier.sortOrder,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then(values => {
      const onSuccess = () => {
        void messageApi.success(fa.captionPricing.tierSaved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)
      const data = { ...values, maxDurationSec: values.maxDurationSec ?? null }
      if (editing) {
        updateTier.mutate({ id: editing.id, data }, { onSuccess, onError })
      } else {
        createTier.mutate(data, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deleteTier.mutate(id, {
      onSuccess: () => void messageApi.success(fa.captionPricing.tierDeleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const sortedTiers = [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const columns: ColumnsType<CaptionPricingTier> = [
    {
      title: fa.captionPricing.sortOrder,
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
    },
    {
      title: fa.captionPricing.maxDurationSec,
      dataIndex: 'maxDurationSec',
      key: 'maxDurationSec',
      width: 160,
      render: (v: number | null) => (v == null ? '∞ (بدون سقف)' : v.toLocaleString('fa-IR')),
    },
    {
      title: fa.captionPricing.creditCost,
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 120,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>ویرایش</Button>
          <Popconfirm title={fa.captionPricing.deleteConfirm} onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={3}>{fa.captionPricing.title}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">{fa.captionPricing.hint}</Text>
      </Card>
      <Card
        title={fa.captionPricing.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            {fa.captionPricing.addTier}
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sortedTiers}
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: fa.captionPricing.noTiers }}
        />
      </Card>

      <Modal
        title={editing ? fa.captionPricing.editTier : fa.captionPricing.addTier}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={createTier.isPending || updateTier.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sortOrder" label={fa.captionPricing.sortOrder} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxDurationSec"
            label={fa.captionPricing.maxDurationSec}
            extra={fa.captionPricing.maxDurationSecHint}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="creditCost" label={fa.captionPricing.creditCost} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
