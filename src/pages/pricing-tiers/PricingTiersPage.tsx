import { useState } from 'react'
import { Table, Button, Modal, Form, InputNumber, Select, Space, Tag, Popconfirm, Typography, Card, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PricingTier, PricingGenerationType } from '@/types/api'
import {
  usePricingTiers,
  useCreatePricingTier,
  useUpdatePricingTier,
  useDeletePricingTier,
} from '@/queries/pricing-tiers.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

const TYPE_LABEL: Record<PricingGenerationType, string> = {
  TEXT: fa.pricingTiers.typeText,
  IMAGE: fa.pricingTiers.typeImage,
  VIDEO: fa.pricingTiers.typeVideo,
}
const TYPE_COLOR: Record<PricingGenerationType, string> = {
  TEXT: 'blue',
  IMAGE: 'green',
  VIDEO: 'purple',
}

interface TierFormValues {
  type: PricingGenerationType
  minToman: number
  maxToman: number | null
  markup: number
}

export function PricingTiersPage() {
  const [form] = Form.useForm<TierFormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PricingTier | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const { data: tiers, isLoading } = usePricingTiers()
  const createTier = useCreatePricingTier()
  const updateTier = useUpdatePricingTier()
  const deleteTier = useDeletePricingTier()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'TEXT', minToman: 0, maxToman: null, markup: 1 })
    setOpen(true)
  }

  function openEdit(tier: PricingTier) {
    setEditing(tier)
    form.setFieldsValue({
      type: tier.type,
      minToman: tier.minToman,
      maxToman: tier.maxToman,
      markup: tier.markup,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then(values => {
      const onSuccess = () => {
        void messageApi.success(fa.pricingTiers.tierSaved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)
      const data = { ...values, maxToman: values.maxToman ?? null }
      if (editing) {
        updateTier.mutate({ id: editing.id, data }, { onSuccess, onError })
      } else {
        createTier.mutate(data, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deleteTier.mutate(id, {
      onSuccess: () => void messageApi.success(fa.pricingTiers.tierDeleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const sortedTiers = [...(tiers ?? [])].sort((a, b) =>
    a.type === b.type ? a.minToman - b.minToman : a.type.localeCompare(b.type),
  )

  const columns: ColumnsType<PricingTier> = [
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      filters: (Object.keys(TYPE_LABEL) as PricingGenerationType[]).map(t => ({ text: TYPE_LABEL[t], value: t })),
      onFilter: (value, record) => record.type === value,
      render: (t: PricingGenerationType) => <Tag color={TYPE_COLOR[t]}>{TYPE_LABEL[t]}</Tag>,
    },
    {
      title: fa.pricingTiers.minToman,
      dataIndex: 'minToman',
      key: 'minToman',
      width: 160,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    {
      title: fa.pricingTiers.maxToman,
      dataIndex: 'maxToman',
      key: 'maxToman',
      width: 160,
      render: (v: number | null) => (v == null ? '∞' : v.toLocaleString('fa-IR')),
    },
    {
      title: fa.pricingTiers.markup,
      dataIndex: 'markup',
      key: 'markup',
      width: 100,
      render: (v: number) => `×${v}`,
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>ویرایش</Button>
          <Popconfirm title={fa.pricingTiers.deleteConfirm} onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={3}>{fa.pricingTiers.title}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Text type="secondary">{fa.pricingTiers.hint}</Text>
      </Card>
      <Card
        title={fa.pricingTiers.title}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            {fa.pricingTiers.addTier}
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={sortedTiers}
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: fa.pricingTiers.noTiers }}
        />
      </Card>

      <Modal
        title={editing ? fa.pricingTiers.editTier : fa.pricingTiers.addTier}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={createTier.isPending || updateTier.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="نوع" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(TYPE_LABEL) as PricingGenerationType[]).map(t => ({
                value: t,
                label: TYPE_LABEL[t],
              }))}
            />
          </Form.Item>
          <Form.Item name="minToman" label={fa.pricingTiers.minToman} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxToman" label={fa.pricingTiers.maxToman} extra={fa.pricingTiers.maxTomanHint}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="markup" label={fa.pricingTiers.markup} rules={[{ required: true }]}>
            <InputNumber min={0} step={0.05} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
