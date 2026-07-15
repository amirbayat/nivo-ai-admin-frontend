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
  Upload,
  message,
} from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { AiModel } from '@/types/api'
import {
  useModels,
  useCreateModel,
  useUpdateModel,
  useDeleteModel,
  useImportModels,
} from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface ModelFormValues {
  name: string
  displayName: string
  provider: string
  modelType: AiModel['modelType']
  inputPricePerM: number
  outputPricePerM: number
  supportsVision: boolean
  supportsImageGen: boolean
  imageGenPriceUsd: number | null
  isActive: boolean
  sortOrder: number
  tier: AiModel['tier']
}

const TIER_COLORS: Record<AiModel['tier'], string> = {
  SIMPLE: 'green',
  MEDIUM: 'blue',
  COMPLEX: 'purple',
}

const MODEL_TYPE_LABELS: Record<AiModel['modelType'], string> = {
  CHAT: 'چت',
  EMBEDDING: 'Embedding',
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
  const [typeFilter, setTypeFilter] = useState<AiModel['modelType'] | undefined>(undefined)
  const [form] = Form.useForm<ModelFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: models, isLoading } = useModels()
  const createModel = useCreateModel()
  const updateModel = useUpdateModel()
  const deleteModel = useDeleteModel()
  const importModels = useImportModels()

  const filteredModels = (models ?? []).filter((m) => !typeFilter || m.modelType === typeFilter)
  const watchedSupportsImageGen: boolean = Form.useWatch('supportsImageGen', form) ?? false

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      supportsVision: false,
      supportsImageGen: false,
      imageGenPriceUsd: null,
      sortOrder: (models?.length ?? 0),
      provider: 'openai',
      tier: 'MEDIUM',
      modelType: 'CHAT',
    })
    setOpen(true)
  }

  function openEdit(model: AiModel) {
    setEditing(model)
    form.setFieldsValue({
      name: model.name,
      displayName: model.displayName,
      provider: model.provider,
      modelType: model.modelType,
      inputPricePerM: model.inputPricePerM,
      outputPricePerM: model.outputPricePerM,
      supportsVision: model.supportsVision,
      supportsImageGen: model.supportsImageGen,
      imageGenPriceUsd: model.imageGenPriceUsd,
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

  function handleImport(file: File) {
    importModels.mutate(file, {
      onSuccess: (result) => {
        if (result.created > 0 || result.updated > 0) {
          void messageApi.success(fa.models.importSuccess(result.created, result.updated))
        }
        if (result.errors.length > 0) {
          Modal.warning({
            title: fa.models.importErrors,
            width: 600,
            content: (
              <ul style={{ maxHeight: 300, overflow: 'auto', paddingRight: 16 }}>
                {result.errors.map((e) => (
                  <li key={e.row}>{fa.models.importRow} {e.row}: {e.message}</li>
                ))}
              </ul>
            ),
          })
        }
      },
      onError: () => void messageApi.error(fa.models.importFailed),
    })
    return false
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
      title: 'نوع',
      dataIndex: 'modelType',
      key: 'modelType',
      width: 100,
      render: (v: AiModel['modelType']) => (
        <Tag color={v === 'EMBEDDING' ? 'cyan' : 'default'}>{MODEL_TYPE_LABELS[v]}</Tag>
      ),
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
      title: fa.models.imageGen,
      dataIndex: 'supportsImageGen',
      key: 'supportsImageGen',
      width: 100,
      render: (v: boolean) => v ? <Tag color="purple">✓ تولید عکس</Tag> : <Tag>—</Tag>,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.models.title}</Title>
        <Space>
          <Select
            allowClear
            placeholder="نوع مدل"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: 'CHAT', label: 'چت' }, { value: 'EMBEDDING', label: 'Embedding' }]}
          />
          <Button icon={<DownloadOutlined />} href="/modelSample.xlsx" target="_blank">
            {fa.models.downloadSample}
          </Button>
          <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleImport}>
            <Button icon={<UploadOutlined />} loading={importModels.isPending}>
              {fa.models.importExcel}
            </Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            {fa.models.addModel}
          </Button>
        </Space>
      </div>

      <div style={{ overflow: 'auto' }}>
        <Table<AiModel>
          rowKey="id"
          dataSource={filteredModels}
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
          <Form.Item
            name="modelType"
            label="نوع مدل"
            rules={[{ required: true }]}
            extra="مدل‌های Embedding فقط برای پایگاه دانش ربات فروش استفاده می‌شوند و در دراپ‌داون‌های چت نمایش داده نمی‌شوند"
          >
            <Select
              options={[
                { value: 'CHAT', label: 'چت (تولید متن)' },
                { value: 'EMBEDDING', label: 'Embedding' },
              ]}
            />
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
            <Form.Item name="supportsImageGen" label={fa.models.imageGen} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label={fa.models.active} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          {watchedSupportsImageGen && (
            <Form.Item
              name="imageGenPriceUsd"
              label="هزینه‌ی هر عکس تولیدشده ($)"
              extra="هزینه‌ی ثابت هر بار تولید عکس با این مدل — برای پلن Pay-as-you-go در ضریب مصرف هم ضرب می‌شود"
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="مثلاً ۰.۰۴" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
