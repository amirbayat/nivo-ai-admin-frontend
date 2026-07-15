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
  imageGenInputImagePricePerM: number | null
  imageGenOutputImagePricePerM: number | null
  imageGenQuality: string | null
  imageGenSize: string | null
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
  IMAGE_GEN: 'تولید عکس',
}

const MODEL_TYPE_TAG_COLORS: Record<AiModel['modelType'], string> = {
  CHAT: 'default',
  EMBEDDING: 'cyan',
  IMAGE_GEN: 'magenta',
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
  const watchedModelType: AiModel['modelType'] | undefined = Form.useWatch('modelType', form)
  const isImageGenType = watchedModelType === 'IMAGE_GEN'

  // مدل IMAGE_GEN اصلاً قابلیت چت/vision ندارد، ولی inputPricePerM همچنان معنادار است (قیمت
  // توکن متنی prompt) — فقط outputPricePerM (خروجی متنی) بی‌ربط است، چون این مدل متن خروجی ندارد
  function handleValuesChange(changed: Partial<ModelFormValues>) {
    if (changed.modelType === 'IMAGE_GEN') {
      form.setFieldsValue({
        supportsImageGen: true,
        supportsVision: false,
        outputPricePerM: 0,
      })
    }
  }

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      supportsVision: false,
      supportsImageGen: false,
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
      imageGenInputImagePricePerM: model.imageGenInputImagePricePerM,
      imageGenOutputImagePricePerM: model.imageGenOutputImagePricePerM,
      imageGenQuality: model.imageGenQuality,
      imageGenSize: model.imageGenSize,
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
        <Tag color={MODEL_TYPE_TAG_COLORS[v]}>{MODEL_TYPE_LABELS[v]}</Tag>
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
            options={[
              { value: 'CHAT', label: 'چت' },
              { value: 'EMBEDDING', label: 'Embedding' },
              { value: 'IMAGE_GEN', label: 'تولید عکس' },
            ]}
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
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onValuesChange={handleValuesChange}>
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
            extra={
              isImageGenType
                ? 'مدل تولید عکس — هیچ قابلیت چت/متنی ندارد، فقط با supportsImageGen و هزینه‌ی هر عکس کار می‌کند'
                : 'مدل‌های Embedding فقط برای پایگاه دانش ربات فروش استفاده می‌شوند و در دراپ‌داون‌های چت نمایش داده نمی‌شوند'
            }
          >
            <Select
              options={[
                { value: 'CHAT', label: 'چت (تولید متن)' },
                { value: 'EMBEDDING', label: 'Embedding' },
                { value: 'IMAGE_GEN', label: 'تولید عکس' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="inputPricePerM"
            label={isImageGenType ? 'قیمت توکن متنی ورودی — prompt ($ به ازای هر ۱M توکن)' : fa.models.inputPrice}
            rules={[{ required: true }]}
            extra={isImageGenType ? 'همون متنی که به‌عنوان توصیف عکس می‌فرستید — معمولاً سهم کوچکی از هزینه‌ی کل است' : undefined}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="2.50" />
          </Form.Item>
          {!isImageGenType && (
            <Form.Item name="outputPricePerM" label={fa.models.outputPrice} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="10.00" />
            </Form.Item>
          )}
          <Form.Item
            name="tier"
            label={isImageGenType ? 'سطح کیفیت' : fa.models.tier}
            rules={[{ required: true }]}
            extra={
              isImageGenType
                ? 'وقتی چند ردیف مدل تولید عکس (با کیفیت/قیمت مختلف) توی یک پلن مجاز باشند، سیستم بر اساس پیچیدگی درخواست کاربر و (برای Pay-as-you-go) موجودی کیف‌پولش خودش این سطح را انتخاب می‌کند — SIMPLE = ارزان‌ترین/ساده‌ترین کیفیت (مثلاً low)، COMPLEX = گران‌ترین/بهترین کیفیت (مثلاً high)'
                : 'مسیریاب هوشمند برای پیام‌های ساده/متوسط/پیچیده از این سطح استفاده می‌کند'
            }
          >
            <Select
              options={[
                { value: 'SIMPLE', label: isImageGenType ? 'ساده / ارزان (مثل low)' : fa.models.tiers.SIMPLE },
                { value: 'MEDIUM', label: isImageGenType ? 'متوسط (مثل medium)' : fa.models.tiers.MEDIUM },
                { value: 'COMPLEX', label: isImageGenType ? 'بالا / گران (مثل high)' : fa.models.tiers.COMPLEX },
              ]}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.models.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Space size="large">
            {!isImageGenType && (
              <Form.Item name="supportsVision" label={fa.models.vision} valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
            <Form.Item name="supportsImageGen" label={fa.models.imageGen} valuePropName="checked">
              <Switch disabled={isImageGenType} />
            </Form.Item>
            <Form.Item name="isActive" label={fa.models.active} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          {watchedSupportsImageGen && (
            <>
              <Form.Item
                name="imageGenSize"
                label="ابعاد تصویر"
                extra="دقیقاً همان مقداری که به provider پاس داده می‌شود — مثل 1024x1024، 1024x1536، 1536x1024"
              >
                <Input placeholder="1024x1024" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
              <Form.Item
                name="imageGenQuality"
                label="کیفیت"
                extra="دقیقاً همان مقداری که provider می‌پذیرد — مثلاً low/medium/high (خانواده‌ی gpt-image) یا standard/hd (dall-e-3)"
              >
                <Input placeholder="medium" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
              <Form.Item
                name="imageGenOutputImagePricePerM"
                label="قیمت توکن عکس خروجی ($ به ازای هر ۱M توکن)"
                extra="هزینه‌ی اصلی تولید عکس. provider بعد از هر بار تولید تعداد توکن خروجی واقعی را برمی‌گرداند و هزینه از همون عدد واقعی حساب می‌شود — نه یک عدد ثابت هر عکس (چون کیفیت/ابعاد بالاتر یعنی توکن خروجی بیشتر، خودش خودکار حساب می‌شود)."
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="8.00" />
              </Form.Item>
              <Form.Item
                name="imageGenInputImagePricePerM"
                label="قیمت توکن عکس ورودی ($ به ازای هر ۱M توکن) — فقط حالت ویرایش"
                extra="وقتی کاربر عکس آپلود می‌کند و می‌خواهد ویرایش/ترکیبش کنید، خود عکس(های) ورودی هم توکن مصرف می‌کنند و جدا حساب می‌شوند. برای تولید از صفر (بدون عکس ورودی) این هزینه صفر می‌ماند."
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="2.50" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
