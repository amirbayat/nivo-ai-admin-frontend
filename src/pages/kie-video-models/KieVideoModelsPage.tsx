import { useState } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { KieVideoCategory, KieVideoModel, VideoModelProvider } from '@/types/api'
import {
  useCreateKieVideoModel,
  useDeleteKieVideoModel,
  useImportKieVideoModels,
  useKieVideoModels,
  useUpdateKieVideoModel,
} from '@/queries/kie-video-models.queries'

const { Title, Text } = Typography

const CATEGORY_OPTIONS: { value: KieVideoCategory; label: string }[] = [
  { value: 'GENERATE', label: 'تولید (پرامپت+عکس/ویدیوی مرجع)' },
  { value: 'EDIT', label: 'ادیت (صحنه‌حفظ‌کننده)' },
  { value: 'UPSCALE', label: 'آپ‌اسکیل' },
  { value: 'LIPSYNC', label: 'Lip Sync' },
  { value: 'DUBBING', label: 'دوبله' },
  { value: 'MOTION_TRANSFER', label: 'انتقال حرکت' },
  { value: 'EXTEND', label: 'تمدید ویدیو' },
  { value: 'OTHER', label: 'سایر' },
]

const RESOLUTION_OPTIONS = ['480p', '720p', '1080p', '2K', '4K']

const PROVIDER_OPTIONS: { value: VideoModelProvider; label: string }[] = [
  { value: 'KIE', label: 'Kie.ai' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
]

interface FormValues {
  provider: VideoModelProvider
  slug: string
  displayName: string
  category: KieVideoCategory
  isActive: boolean
  sortOrder: number
  supportsImages: boolean
  maxImages?: number
  supportsVideo: boolean
  maxVideoDurationSec?: number
  maxVideoWindowSec?: number
  supportsAspectRatio: boolean
  supportsDuration: boolean
  resolutions: string[]
  pricePerSecondUsdConfirmed?: number
  pricingNote?: string
}

// docs/PRD-video-edit-omni-kie.md — «همه‌ی این مدل‌ها رو می‌خوام» (کاربر) → این صفحه دقیقاً
// همون جواب است: کاتالوگ ادمین‌قابل‌مدیریت به‌جای مدل هاردکد؛ افزودن مدل بیست‌ویکم یعنی یک
// ردیف جدید از همین‌جا، نه دیپلوی کد. الگوی CRUD دقیقاً هم‌شکل CategoryTreePage.tsx.
export function KieVideoModelsPage() {
  const { data: models, isLoading } = useKieVideoModels()
  const createModel = useCreateKieVideoModel()
  const updateModel = useUpdateKieVideoModel()
  const deleteModel = useDeleteKieVideoModel()
  const importModels = useImportKieVideoModels()
  const [form] = Form.useForm<FormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<KieVideoModel | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      provider: 'KIE',
      isActive: true,
      sortOrder: 0,
      supportsImages: false,
      supportsVideo: false,
      supportsAspectRatio: true,
      supportsDuration: true,
      resolutions: ['720p'],
    })
    setOpen(true)
  }

  function openEdit(model: KieVideoModel) {
    setEditing(model)
    form.setFieldsValue({
      provider: model.provider,
      slug: model.slug,
      displayName: model.displayName,
      category: model.category,
      isActive: model.isActive,
      sortOrder: model.sortOrder,
      supportsImages: model.supportsImages,
      maxImages: model.maxImages ?? undefined,
      supportsVideo: model.supportsVideo,
      maxVideoDurationSec: model.maxVideoDurationSec ?? undefined,
      maxVideoWindowSec: model.maxVideoWindowSec ?? undefined,
      supportsAspectRatio: model.supportsAspectRatio,
      supportsDuration: model.supportsDuration,
      resolutions: model.resolutions,
      pricePerSecondUsdConfirmed: model.pricePerSecondUsdConfirmed ?? undefined,
      pricingNote: model.pricingNote ?? undefined,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then(values => {
      const onSuccess = () => {
        void messageApi.success('ذخیره شد')
        setOpen(false)
      }
      const onError = () => void messageApi.error('ذخیره نشد، دوباره امتحان کن')

      if (editing) {
        updateModel.mutate({ id: editing.id, ...values }, { onSuccess, onError })
      } else {
        createModel.mutate(values, { onSuccess, onError })
      }
    })
  }

  // دقیقاً هم‌الگوی handleImport در ModelsPage.tsx (اکسل AiModel) — upsert روی slug به‌جای name
  function handleImport(file: File) {
    importModels.mutate(file, {
      onSuccess: result => {
        if (result.created > 0 || result.updated > 0) {
          void messageApi.success(`${result.created} مدل اضافه شد، ${result.updated} مدل به‌روزرسانی شد`)
        }
        if (result.errors.length > 0) {
          Modal.warning({
            title: 'در برخی ردیف‌ها خطا وجود داشت',
            width: 600,
            content: (
              <ul style={{ maxHeight: 300, overflow: 'auto', paddingRight: 16 }}>
                {result.errors.map(e => (
                  <li key={e.row}>ردیف {e.row}: {e.message}</li>
                ))}
              </ul>
            ),
          })
        }
      },
      onError: () => void messageApi.error('آپلود فایل با خطا مواجه شد'),
    })
    return false
  }

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>کاتالوگ مدل‌های ویدیو (ادیت ویدیو)</Title>
        <Space>
          <Button icon={<DownloadOutlined />} href="/kieVideoModelSample.xlsx" target="_blank">
            دانلود نمونه اکسل
          </Button>
          <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleImport}>
            <Button icon={<UploadOutlined />} loading={importModels.isPending}>آپلود اکسل</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن مدل</Button>
        </Space>
      </div>
      <p style={{ color: '#888', marginBottom: 16 }}>
        هر مدل (چه Kie.ai چه OpenRouter) یک ردیف اینجاست. provider تعیین می‌کند کدام API صدا زده
        شود؛ «slug» دقیقاً همان شناسه‌ای است که به آن provider فرستاده می‌شود (توضیح کامل در فیلد
        پایین). غیرفعال‌کردن یک مدل (نه حذف واقعی) باعث می‌شود دیگر در انتخابگر «ویرایش ویدیو» دیده
        نشود، ولی جاب‌های قدیمی‌اش دست‌نخورده می‌مانند.
      </p>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={models}
        pagination={false}
        columns={[
          { title: 'نام نمایشی', dataIndex: 'displayName' },
          {
            title: 'provider',
            dataIndex: 'provider',
            render: (v: VideoModelProvider) => (
              <Tag color={v === 'OPENROUTER' ? 'purple' : 'geekblue'}>
                {PROVIDER_OPTIONS.find(o => o.value === v)?.label ?? v}
              </Tag>
            ),
          },
          { title: 'slug', dataIndex: 'slug', render: (v: string) => <Text code>{v}</Text> },
          {
            title: 'دسته',
            dataIndex: 'category',
            render: (v: KieVideoCategory) => CATEGORY_OPTIONS.find(o => o.value === v)?.label ?? v,
          },
          {
            title: 'قابلیت‌ها',
            render: (_, m: KieVideoModel) => (
              <Space size={4} wrap>
                {m.supportsImages && <Tag color="green">عکس (تا {m.maxImages ?? '?'})</Tag>}
                {m.supportsVideo && (
                  <Tag color="blue">
                    ویدیو (پنجره تا {m.maxVideoWindowSec ?? '?'}ث از فایل تا {m.maxVideoDurationSec ?? '?'}ث)
                  </Tag>
                )}
              </Space>
            ),
          },
          {
            title: 'قیمت تأییدشده',
            render: (_, m: KieVideoModel) =>
              m.pricePerSecondUsdConfirmed != null ? (
                <span title={m.pricingNote ?? ''}>${m.pricePerSecondUsdConfirmed.toFixed(5)}/ث</span>
              ) : (
                <Tag color="orange">تست نشده</Tag>
              ),
          },
          {
            title: 'وضعیت',
            dataIndex: 'isActive',
            render: (v: boolean) => (v ? <Tag color="green">فعال</Tag> : <Tag color="red">غیرفعال</Tag>),
          },
          {
            title: '',
            render: (_, m: KieVideoModel) => (
              <Space size={4}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(m)} />
                <Popconfirm title="این مدل غیرفعال شود؟" onConfirm={() => deleteModel.mutate(m.id)}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={open}
        title={editing ? 'ویرایش مدل' : 'افزودن مدل'}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText="ذخیره"
        cancelText="انصراف"
        confirmLoading={createModel.isPending || updateModel.isPending}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="provider" label="provider" rules={[{ required: true }]}>
            <Select options={PROVIDER_OPTIONS} disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="slug"
            label="slug"
            extra="برای Kie.ai: فیلد «model» در createTask (مثلاً gemini-omni-video). برای OpenRouter: شناسه‌ی دقیق مدل (مثلاً bytedance/seedance-2.5)."
            rules={[{ required: true }]}
          >
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="displayName" label="نام نمایشی" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="دسته" rules={[{ required: true }]}>
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="resolutions" label="رزولوشن‌های پشتیبانی‌شده">
            <Select mode="multiple" options={RESOLUTION_OPTIONS.map(r => ({ value: r, label: r }))} />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="supportsImages" label="عکس مرجع می‌پذیرد" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="maxImages" label="حداکثر تعداد عکس">
              <InputNumber min={0} />
            </Form.Item>
          </Space>
          <Space size={16}>
            <Form.Item name="supportsVideo" label="ویدیو می‌پذیرد" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="maxVideoDurationSec" label="حداکثر طول فایل مبدأ (ث)">
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="maxVideoWindowSec" label="حداکثر پهنای پنجره (ث)">
              <InputNumber min={1} />
            </Form.Item>
          </Space>
          <Space size={16}>
            <Form.Item name="supportsAspectRatio" label="نسبت تصویر قابل‌انتخاب" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="supportsDuration" label="مدت قابل‌انتخاب" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item
            name="pricePerSecondUsdConfirmed"
            label="قیمت تأییدشده به‌ازای ثانیه (USD)"
            extra="فقط بعد از یک تست واقعی پر کن (creditsConsumed × 0.005) — خالی یعنی preflight از نرخ محافظه‌کارانه‌ی پیش‌فرض ($۰.۱۰) استفاده می‌کند."
          >
            <InputNumber min={0} step={0.001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="pricingNote" label="یادداشت قیمت (اختیاری)">
            <Input.TextArea rows={2} placeholder="مثلاً: تست واقعی ۱۴۰۵/۰۶/۱۵، ۴ث/۷۲۰p = ۶۳ credit" />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="sortOrder" label="ترتیب نمایش">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="isActive" label="فعال" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
