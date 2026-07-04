import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { AiModel } from '@/types/api'
import { useModels, useCreateModel, useUpdateModel, useDeleteModel } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface ModelFormValues {
  name: string
  displayName: string
  provider: string
  inputPricePerM: number
  outputPricePerM: number
  supportsVision: boolean
  isActive: boolean
  sortOrder: number
  tier: AiModel['tier']
}

const TIER_COLORS: Record<AiModel['tier'], string> = {
  SIMPLE: 'green',
  MEDIUM: 'blue',
  COMPLEX: 'purple',
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'green',
  anthropic: 'purple',
  google: 'blue',
  meta: 'orange',
}

export function ModelsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AiModel | null>(null)
  const [form] = Form.useForm<ModelFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: models, isLoading } = useModels()
  const createModel = useCreateModel()
  const updateModel = useUpdateModel()
  const deleteModel = useDeleteModel()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      supportsVision: false,
      sortOrder: (models?.length ?? 0),
      provider: 'openai',
      tier: 'MEDIUM',
    })
    setOpen(true)
  }

  function openEdit(model: AiModel) {
    setEditing(model)
    form.setFieldsValue({
      name: model.name,
      displayName: model.displayName,
      provider: model.provider,
      inputPricePerM: model.inputPricePerM,
      outputPricePerM: model.outputPricePerM,
      supportsVision: model.supportsVision,
      isActive: model.isActive,
      sortOrder: model.sortOrder,
      tier: model.tier,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const onSuccess = () => {
        void messageApi.success(fa.models.saved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updateModel.mutate({ id: editing.id, data: values }, { onSuccess, onError })
      } else {
        createModel.mutate(values, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deleteModel.mutate(id, {
      onSuccess: () => void messageApi.success(fa.models.deleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const columns: ColumnsType<AiModel> = [
    {
      title: fa.models.displayName,
      dataIndex: 'displayName',
      key: 'displayName',
      fixed: 'right',
      width: 130,
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{v}</span>
          <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>{r.name}</span>
        </Space>
      ),
    },
    {
      title: fa.models.provider,
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (v: string) => <Tag color={PROVIDER_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: fa.models.inputPrice,
      dataIndex: 'inputPricePerM',
      key: 'inputPricePerM',
      width: 130,
      render: (v: number) => <span style={{ fontFamily: 'monospace' }}>${v.toFixed(2)}</span>,
    },
    {
      title: fa.models.outputPrice,
      dataIndex: 'outputPricePerM',
      key: 'outputPricePerM',
      width: 130,
      render: (v: number) => <span style={{ fontFamily: 'monospace' }}>${v.toFixed(2)}</span>,
    },
    {
      title: fa.models.vision,
      dataIndex: 'supportsVision',
      key: 'supportsVision',
      width: 100,
      render: (v: boolean) => v ? <Tag color="blue">✓ Vision</Tag> : <Tag>—</Tag>,
    },
    {
      title: fa.models.tier,
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (v: AiModel['tier']) => <Tag color={TIER_COLORS[v]}>{fa.models.tiers[v]}</Tag>,
    },
    {
      title: fa.models.sortOrder,
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: fa.models.active,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'فعال' : 'غیرفعال'}</Tag>,
    },
    {
      title: fa.common.actions,
      key: 'actions',
      fixed: 'left',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>{fa.models.editModel}</Button>
          <Popconfirm title={fa.models.deleteConfirm} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger loading={deleteModel.isPending}>
              {fa.models.deleteModel}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const isSaving = createModel.isPending || updateModel.isPending

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.models.title}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {fa.models.addModel}
        </Button>
      </div>

      <div style={{ overflow: 'auto' }}>
        <Table<AiModel>
          rowKey="id"
          dataSource={models ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        open={open}
        title={editing ? fa.models.editModel : fa.models.addModel}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={isSaving}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={fa.models.name}
            rules={[{ required: true }]}
            extra="مثال: openai/gpt-4o"
          >
            <Input placeholder="openai/gpt-4o" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="displayName" label={fa.models.displayName} rules={[{ required: true }]}>
            <Input placeholder="GPT-4o" />
          </Form.Item>
          <Form.Item name="provider" label={fa.models.provider} rules={[{ required: true }]}>
            <Input placeholder="openai" />
          </Form.Item>
          <Form.Item name="inputPricePerM" label={fa.models.inputPrice} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="2.50" />
          </Form.Item>
          <Form.Item name="outputPricePerM" label={fa.models.outputPrice} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="10.00" />
          </Form.Item>
          <Form.Item
            name="tier"
            label={fa.models.tier}
            rules={[{ required: true }]}
            extra="مسیریاب هوشمند برای پیام‌های ساده/متوسط/پیچیده از این سطح استفاده می‌کند"
          >
            <Select
              options={[
                { value: 'SIMPLE', label: fa.models.tiers.SIMPLE },
                { value: 'MEDIUM', label: fa.models.tiers.MEDIUM },
                { value: 'COMPLEX', label: fa.models.tiers.COMPLEX },
              ]}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.models.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="supportsVision" label={fa.models.vision} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label={fa.models.active} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
