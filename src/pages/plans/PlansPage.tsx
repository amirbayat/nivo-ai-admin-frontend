import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  message,
  Tooltip,
  Divider,
  Select,
} from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Plan } from '@/types/api'
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, useModels } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface ThrottleStepValue {
  afterMessages: number
  maxOutputTokens: number
}

interface PlanFormValues {
  name: string
  priceMonthly: number
  dailyFreeTokens: number
  monthlyTotalTokens: number
  allowedModels: string[]
  sortOrder: number
  isActive: boolean
  isPopular: boolean
  featuredModels: string[]
  featuredModelsCount: number
  dailyMessageLimit: number | null
  throttledMessageCount: number | null
  throttledInputTokens: number | null
  throttledOutputTokens: number | null
  maxInputTokens: number | null
  outputThrottleSteps: ThrottleStepValue[]
  rollingWindowLimit: number | null
  rollingWindowHours: number
  contextMd: string | null
  reasoningEffort: string | null
  trialMessageThreshold: number | null
  trialDailyMessageLimit: number | null
  trialThrottledMessageCount: number | null
  trialRollingWindowLimit: number | null
  trialRollingWindowHours: number | null
  isPayAsYouGo: boolean
  payAsYouGoMarkup: number | null
  payAsYouGoMinActivationToman: number | null
  payAsYouGoMinTopupToman: number | null
  payAsYouGoTopupPresetsText: string // comma-separated در فرم — number[] موقع ذخیره
}

export function PlansPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form] = Form.useForm<PlanFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: plans, isLoading } = usePlans()
  const { data: allModels, isLoading: modelsLoading } = useModels()
  // مدل‌های embedding فقط برای پایگاه دانش ربات فروش هستند، هرگز گزینه‌ی پلن نمی‌شوند —
  // مدل‌های IMAGE_GEN اینجا مجازند چون باید بشود آن‌ها را هم به allowedModels یک پلن اضافه کرد
  // (مسیریاب مدل جدا و همچنان فقط modelType:'CHAT' برای پاسخ متنی فیلتر می‌کند)
  const availableModels = allModels?.filter((m) => m.modelType !== 'EMBEDDING')
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()

  // مدل‌های ویژه فقط می‌توانند زیرمجموعه‌ی مدل‌های مجاز باشند — با تغییر allowedModels فیلتر می‌شود
  const watchedAllowedModels: string[] = Form.useWatch('allowedModels', form) ?? []
  // همون فیلد isActive موجود، خاموش/روشن کردن PAYG هم هست — فقط برچسبش برای این پلن روشن‌تر می‌شود
  const watchedIsPayAsYouGo: boolean = Form.useWatch('isPayAsYouGo', form) ?? false

  function handleValuesChange(changed: Partial<PlanFormValues>) {
    if (changed.allowedModels) {
      const stillValid = (form.getFieldValue('featuredModels') as string[] | undefined ?? [])
        .filter(m => changed.allowedModels!.includes(m))
      form.setFieldValue('featuredModels', stillValid)
    }
  }

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      sortOrder: 0,
      maxInputTokens: 300,
      outputThrottleSteps: [],
      allowedModels: [],
      rollingWindowHours: 3,
      isPopular: false,
      featuredModels: [],
      featuredModelsCount: 5,
      isPayAsYouGo: false,
      payAsYouGoMarkup: 1.3,
      payAsYouGoMinActivationToman: 1_000_000,
      payAsYouGoMinTopupToman: 500_000,
      payAsYouGoTopupPresetsText: '1000000,2000000,5000000',
    })
    setOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditing(plan)
    form.setFieldsValue({
      name: plan.name,
      priceMonthly: plan.priceMonthly, // تومان — بدون تبدیل
      dailyFreeTokens: plan.dailyFreeTokens,
      monthlyTotalTokens: plan.monthlyTotalTokens,
      allowedModels: plan.allowedModels,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      featuredModels: plan.featuredModels,
      featuredModelsCount: plan.featuredModelsCount,
      dailyMessageLimit: plan.dailyMessageLimit ?? null,
      throttledMessageCount: plan.throttledMessageCount ?? null,
      throttledInputTokens: plan.throttledInputTokens ?? null,
      throttledOutputTokens: plan.throttledOutputTokens ?? null,
      maxInputTokens: plan.maxInputTokens ?? null,
      outputThrottleSteps: (plan.outputThrottleSteps as ThrottleStepValue[] | null) ?? [],
      rollingWindowLimit: plan.rollingWindowLimit ?? null,
      rollingWindowHours: plan.rollingWindowHours ?? 3,
      contextMd: plan.contextMd ?? null,
      reasoningEffort: plan.reasoningEffort ?? null,
      trialMessageThreshold: plan.trialMessageThreshold ?? null,
      trialDailyMessageLimit: plan.trialDailyMessageLimit ?? null,
      trialThrottledMessageCount: plan.trialThrottledMessageCount ?? null,
      trialRollingWindowLimit: plan.trialRollingWindowLimit ?? null,
      trialRollingWindowHours: plan.trialRollingWindowHours ?? null,
      isPayAsYouGo: plan.isPayAsYouGo,
      payAsYouGoMarkup: plan.payAsYouGoMarkup ?? 1.3,
      payAsYouGoMinActivationToman: plan.payAsYouGoMinActivationToman ?? 1_000_000,
      payAsYouGoMinTopupToman: plan.payAsYouGoMinTopupToman ?? 500_000,
      payAsYouGoTopupPresetsText: (plan.payAsYouGoTopupPresets ?? [1_000_000, 2_000_000, 5_000_000]).join(','),
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const payload = {
        name: values.name,
        priceMonthly: values.priceMonthly, // تومان — بدون تبدیل
        dailyFreeTokens: values.dailyFreeTokens,
        monthlyTotalTokens: values.monthlyTotalTokens,
        allowedModels: values.allowedModels,
        features: {},
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        isPopular: values.isPopular ?? false,
        featuredModels: values.featuredModels ?? [],
        featuredModelsCount: values.featuredModelsCount ?? 5,
        dailyMessageLimit: values.dailyMessageLimit ?? null,
        throttledMessageCount: values.throttledMessageCount ?? null,
        throttledInputTokens: values.throttledInputTokens ?? null,
        throttledOutputTokens: values.throttledOutputTokens ?? null,
        maxInputTokens: values.maxInputTokens ?? 300,
        outputThrottleSteps: (values.outputThrottleSteps ?? []).filter(s => s?.afterMessages && s?.maxOutputTokens),
        rollingWindowLimit: values.rollingWindowLimit ?? null,
        rollingWindowHours: values.rollingWindowHours ?? 3,
        contextMd: values.contextMd ?? null,
        reasoningEffort: values.reasoningEffort ?? null,
        trialMessageThreshold: values.trialMessageThreshold ?? null,
        trialDailyMessageLimit: values.trialDailyMessageLimit ?? null,
        trialThrottledMessageCount: values.trialThrottledMessageCount ?? null,
        trialRollingWindowLimit: values.trialRollingWindowLimit ?? null,
        trialRollingWindowHours: values.trialRollingWindowHours ?? null,
        isPayAsYouGo: values.isPayAsYouGo ?? false,
        payAsYouGoMarkup: values.payAsYouGoMarkup ?? 1.3,
        payAsYouGoMinActivationToman: values.payAsYouGoMinActivationToman ?? 1_000_000,
        payAsYouGoMinTopupToman: values.payAsYouGoMinTopupToman ?? 500_000,
        payAsYouGoTopupPresets: (values.payAsYouGoTopupPresetsText ?? '')
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
        // simpleModel عمداً اینجا فرستاده نمی‌شود — هم بک‌اند این فیلد را روی این endpoint
        // نمی‌پذیرد، هم مقدارش فقط باید از صفحه‌ی «مسیریابی مدل‌ها» تغییر کند (وگرنه هر ذخیره‌ی
        // معمولی پلن، مقدار تنظیم‌شده‌ی آنجا را بی‌صدا null می‌کرد)
      }
      const onSuccess = () => {
        void messageApi.success(fa.plans.saved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updatePlan.mutate({ id: editing.id, data: payload }, { onSuccess, onError })
      } else {
        createPlan.mutate(payload, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deletePlan.mutate(id, {
      onSuccess: () => void messageApi.success(fa.plans.deleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const columns: ColumnsType<Plan> = [
    { title: fa.plans.name, dataIndex: 'name', key: 'name', fixed: 'right', width: 120 },
    {
      title: fa.plans.price,
      dataIndex: 'priceMonthly',
      key: 'priceMonthly',
      width: 110,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    { title: 'توکن رایگان/روز', dataIndex: 'dailyFreeTokens', key: 'dailyFreeTokens', width: 120 },
    { title: 'توکن ماهانه', dataIndex: 'monthlyTotalTokens', key: 'monthlyTotalTokens', width: 110 },
    {
      title: fa.plans.models,
      dataIndex: 'allowedModels',
      key: 'allowedModels',
      width: 200,
      render: (models: string[]) => (
        <Space wrap size={4}>
          {models.map((m) => <Tag key={m} style={{ margin: 0 }}>{m}</Tag>)}
        </Space>
      ),
    },
    {
      title: 'N — سقف معمولی',
      dataIndex: 'dailyMessageLimit',
      key: 'dailyMessageLimit',
      width: 130,
      render: (v: number | null) => v != null ? <Tag color="orange">{v} پیام</Tag> : <Tag>نامحدود</Tag>,
    },
    {
      title: 'M — ناحیه محدود',
      dataIndex: 'throttledMessageCount',
      key: 'throttledMessageCount',
      width: 130,
      render: (v: number | null) => v != null ? <Tag color="purple">{v} پیام</Tag> : <Tag>—</Tag>,
    },
    {
      title: 'ورودی محدود (توکن)',
      dataIndex: 'throttledInputTokens',
      key: 'throttledInputTokens',
      width: 150,
      render: (v: number | null) => v != null ? <Tag color="cyan">{v}</Tag> : <Tag>—</Tag>,
    },
    {
      title: 'خروجی محدود (توکن)',
      dataIndex: 'throttledOutputTokens',
      key: 'throttledOutputTokens',
      width: 160,
      render: (v: number | null) => v != null ? <Tag color="geekblue">{v}</Tag> : <Tag>—</Tag>,
    },
    {
      title: 'سقف ورودی عادی',
      dataIndex: 'maxInputTokens',
      key: 'maxInputTokens',
      width: 130,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'کاهش خروجی پله‌ای',
      dataIndex: 'outputThrottleSteps',
      key: 'outputThrottleSteps',
      width: 150,
      render: (v: ThrottleStepValue[]) =>
        v?.length ? (
          <Tooltip title={v.map(s => `بعد از ${s.afterMessages} پیام → ${s.maxOutputTokens} توکن`).join(' | ')}>
            <Tag color="purple">{v.length} مرحله</Tag>
          </Tooltip>
        ) : (
          <Tag>—</Tag>
        ),
    },
    {
      title: 'پنجره‌ی لغزان',
      key: 'rollingWindow',
      width: 150,
      render: (_, r) =>
        r.rollingWindowLimit != null ? (
          <Tag color="red">{r.rollingWindowLimit} پیام / {r.rollingWindowHours} ساعت</Tag>
        ) : (
          <Tag>غیرفعال</Tag>
        ),
    },
    {
      title: 'محبوب‌ترین',
      dataIndex: 'isPopular',
      key: 'isPopular',
      width: 100,
      render: (v: boolean) => (v ? <Tag color="gold">محبوب‌ترین</Tag> : <Tag>—</Tag>),
    },
    {
      title: 'Pay-as-you-go',
      dataIndex: 'isPayAsYouGo',
      key: 'isPayAsYouGo',
      width: 120,
      render: (v: boolean, r) =>
        v ? (
          <Tag color={r.isActive ? 'magenta' : 'default'}>
            PAYG × {r.payAsYouGoMarkup ?? 1.3} {!r.isActive && '(خاموش)'}
          </Tag>
        ) : (
          <Tag>—</Tag>
        ),
    },
    {
      title: 'مدل‌های ویژه',
      dataIndex: 'featuredModels',
      key: 'featuredModels',
      width: 130,
      render: (v: string[]) => <Tag color="blue">{v?.length ?? 0} مدل</Tag>,
    },
    { title: fa.plans.sortOrder, dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    {
      title: fa.plans.active,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? fa.plans.active : '—'}</Tag>,
    },
    {
      title: fa.common.actions,
      key: 'actions',
      fixed: 'left',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>{fa.plans.editPlan}</Button>
          <Popconfirm title={fa.plans.deleteConfirm} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger loading={deletePlan.isPending}>{fa.plans.deletePlan}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const isSaving = createPlan.isPending || updatePlan.isPending

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.plans.title}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{fa.plans.addPlan}</Button>
      </div>

      {/* table scrolls horizontally inside its own container — page doesn't scroll */}
      <div style={{ overflow: 'auto' }}>
        <Table<Plan>
          rowKey="id"
          dataSource={plans ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        open={open}
        title={editing ? fa.plans.editPlan : fa.plans.addPlan}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={isSaving}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onValuesChange={handleValuesChange}>
          <Form.Item name="name" label={fa.plans.name} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priceMonthly" label={fa.plans.price} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="dailyFreeTokens"
            label="توکن رایگان روزانه"
            extra="برای پلن‌های نقره‌ای و طلایی صفر بگذارید — توکن از حساب ماهانه کسر می‌شود"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="monthlyTotalTokens" label={fa.plans.monthlyTotal} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="allowedModels" label={fa.plans.models} rules={[{ required: true, type: 'array', min: 1 }]}>
            <Select
              mode="multiple"
              loading={modelsLoading}
              placeholder="انتخاب مدل‌های مجاز"
              options={(availableModels ?? []).filter(m => m.isActive).map(m => ({
                value: m.name,
                label: m.modelType === 'IMAGE_GEN'
                  ? `🎨 ${m.displayName} (${m.name})`
                  : `${m.displayName} (${m.name})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="featuredModels"
            label="مدل‌های ویژه‌ی این پلن"
            extra="زیرمجموعه‌ای از مدل‌های مجاز بالا — این‌ها همان مدل‌هایی هستند که توی دراپ‌داون چت و روی کارت پلن به کاربر نشان داده می‌شوند. ترتیب انتخاب = ترتیب نمایش."
          >
            <Select
              mode="multiple"
              loading={modelsLoading}
              placeholder="انتخاب مدل‌های ویژه (اختیاری — خالی = همه‌ی مدل‌های مجاز)"
              options={(availableModels ?? [])
                .filter(m => watchedAllowedModels.includes(m.name))
                .map(m => ({
                  value: m.name,
                  label: m.modelType === 'IMAGE_GEN'
                    ? `🎨 ${m.displayName} (${m.name})`
                    : `${m.displayName} (${m.name})`,
                }))}
            />
          </Form.Item>
          <Form.Item
            name="featuredModelsCount"
            label="تعداد مدل ویژه روی کارت پلن"
            extra="چند مورد از مدل‌های ویژه، قبل از دکمه‌ی «N مدل دیگر»، روی کارت پلن نشان داده شود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="۵" />
          </Form.Item>
          <Form.Item name="isPopular" label="نشان «محبوب‌ترین»" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.plans.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>محدودیت پیام روزانه</Divider>

          <Form.Item
            name="dailyMessageLimit"
            label="N — سقف پیام معمولی روزانه"
            extra="خالی = نامحدود. بعد از N پیام کاربر وارد ناحیه محدود می‌شود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۱۰" />
          </Form.Item>
          <Form.Item
            name="throttledMessageCount"
            label="M — تعداد پیام در ناحیه محدود (بعد از N)"
            extra="خالی یا ۰ = بعد از N پیام مستقیم بلاک. با عدد = M پیام دیگر با توکن کمتر مجاز است"
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="مثلاً ۵" />
          </Form.Item>
          <Form.Item
            name="throttledInputTokens"
            label="سقف توکن ورودی در ناحیه محدود"
            extra="خالی = از سقف ورودی عادی استفاده می‌شود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۱۰۰" />
          </Form.Item>
          <Form.Item
            name="throttledOutputTokens"
            label="سقف توکن خروجی در ناحیه محدود"
            extra="خالی = بدون محدودیت خروجی در ناحیه محدود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۲۰۰" />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>پنجره‌ی لغزان (محدودیت ضدسوءاستفاده)</Divider>

          <Form.Item
            name="rollingWindowLimit"
            label="سقف پیام در پنجره"
            extra="خالی = غیرفعال برای این پلن. مکمل سقف روزانه‌ی بالاست، نه جایگزین آن"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۵" />
          </Form.Item>
          <Form.Item
            name="rollingWindowHours"
            label="طول پنجره (ساعت)"
            extra="پیش‌فرض ۳ ساعت"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="۳" />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>سایر محدودیت‌ها</Divider>

          <Form.Item
            name="maxInputTokens"
            label="سقف توکن ورودی در حالت عادی"
            extra="پیش‌فرض: ۳۰۰"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="۳۰۰" />
          </Form.Item>

          <Form.Item
            label="کاهش خروجی پله‌ای (اختیاری)"
            extra="اگر بعد از X پیام در روز می‌خواهید سقف خروجی هر پیام کاهش یابد. مثال: بعد از ۵ پیام → ۵۰۰ توکن، بعد از ۱۰ پیام → ۲۰۰ توکن"
          >
            <Form.List name="outputThrottleSteps">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }} wrap>
                      <Form.Item
                        name={[name, 'afterMessages']}
                        rules={[{ required: true, message: 'الزامی' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} addonBefore="بعد از" addonAfter="پیام" placeholder="5" style={{ width: 190 }} />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'maxOutputTokens']}
                        rules={[{ required: true, message: 'الزامی' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={1} addonAfter="توکن خروجی" placeholder="500" style={{ width: 190 }} />
                      </Form.Item>
                      <MinusCircleOutlined style={{ color: '#ff4d4f' }} onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 4 }}>
                    افزودن مرحله
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>Context</Divider>

          <Form.Item
            name="contextMd"
            label="Context اختصاصی این پلن"
            extra="بعد از کانتکست عمومی (صفحه‌ی «تنظیمات چت») به system prompt همه‌ی مکالمات کاربرانی که این پلن را دارند اضافه می‌شود. اختیاری — خالی یعنی چیزی اضافه نمی‌شود."
          >
            <Input.TextArea rows={4} placeholder="مثلاً محدودیت‌ها یا لحن مخصوص این پلن..." />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>Reasoning</Divider>

          <Form.Item
            name="reasoningEffort"
            label="میزان reasoning effort پیش‌فرض این پلن"
            extra="فقط روی مدل‌های reasoning (مثل خانواده‌ی gpt-5) اثر دارد. خالی = پیش‌فرض پلتفرم (معمولاً medium). می‌توان به‌ازای هر استپ بودجه‌ای هم در صفحه‌ی «مسیریابی مدل‌ها» override کرد."
          >
            <Select
              allowClear
              placeholder="پیش‌فرض پلتفرم"
              options={[
                { value: 'minimal', label: 'حداقل (سریع‌ترین، ارزان‌ترین)' },
                { value: 'low', label: 'کم' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'بالا (کندتر، دقیق‌تر)' },
              ]}
            />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>دوره‌ی آزمایشی کاربر تازه</Divider>

          <Form.Item
            name="trialMessageThreshold"
            label="آستانه‌ی پیام (کل عمر کاربر)"
            extra="خالی = بدون دوره‌ی آزمایشی. مثلاً ۶۰ — تا این تعداد پیام (نه روزانه، کل عمر کاربر)، محدودیت‌های زیر به‌جای محدودیت همیشگی بالا اعمال می‌شود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۶۰" />
          </Form.Item>
          <Form.Item
            name="trialDailyMessageLimit"
            label="N آزمایشی — سقف پیام معمولی روزانه"
            extra="خالی = از سقف همیشگی بالا استفاده می‌شود"
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۲۰" />
          </Form.Item>
          <Form.Item name="trialThrottledMessageCount" label="M آزمایشی — تعداد پیام در ناحیه محدود">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="مثلاً ۱۰" />
          </Form.Item>
          <Form.Item name="trialRollingWindowLimit" label="سقف پیام در پنجره‌ی لغزان (آزمایشی)">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۱۵" />
          </Form.Item>
          <Form.Item name="trialRollingWindowHours" label="طول پنجره‌ی لغزان — ساعت (آزمایشی)">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="مثلاً ۳" />
          </Form.Item>

          <Divider orientation="right" style={{ fontSize: 13 }}>Pay-as-you-go (کیف‌پول)</Divider>

          <Form.Item
            name="isPayAsYouGo"
            label="پلن Pay-as-you-go است"
            valuePropName="checked"
            extra="بدون بودجه‌ی روزانه/ماهانه و بدون fallback پله‌ای به مدل ارزان‌تر — فقط موجودی کیف‌پول کاربر (docs/PRD-pay-as-you-go-wallet.md)"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="payAsYouGoMarkup"
            label="ضریب قیمت (مصرف واقعی × این عدد از کیف‌پول کم می‌شود)"
          >
            <InputNumber style={{ width: '100%' }} min={1} step={0.1} placeholder="۱.۳" />
          </Form.Item>
          <Form.Item
            name="payAsYouGoMinActivationToman"
            label="حداقل شارژ برای فعال‌سازی اولیه (تومان)"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100000} placeholder="۱٬۰۰۰٬۰۰۰" />
          </Form.Item>
          <Form.Item
            name="payAsYouGoMinTopupToman"
            label="حداقل شارژهای بعدی (تومان)"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={50000} placeholder="۵۰۰٬۰۰۰" />
          </Form.Item>
          <Form.Item
            name="payAsYouGoTopupPresetsText"
            label="گزینه‌های پیش‌فرض شارژ (تومان، با کاما جدا کنید)"
            extra="مثال: 1000000,2000000,5000000"
          >
            <Input placeholder="1000000,2000000,5000000" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={watchedIsPayAsYouGo ? 'فعال بودن Pay-as-you-go' : fa.plans.active}
            valuePropName="checked"
            extra={
              watchedIsPayAsYouGo
                ? 'خاموش کردن این کلید یعنی: کارت Pay-as-you-go از صفحه‌ی قیمت‌گذاری مخفی می‌شود و شارژ/فعال‌سازی جدید مسدود می‌شود — کاربرانی که از قبل فعال کرده‌اند و موجودی دارند، همچنان می‌توانند مثل قبل چت کنند.'
                : undefined
            }
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
