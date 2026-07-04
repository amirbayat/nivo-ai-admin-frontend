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
  dailyMessageLimit: number | null
  throttledMessageCount: number | null
  throttledInputTokens: number | null
  throttledOutputTokens: number | null
  maxInputTokens: number | null
  outputThrottleSteps: ThrottleStepValue[]
}

export function PlansPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form] = Form.useForm<PlanFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: plans, isLoading } = usePlans()
  const { data: availableModels, isLoading: modelsLoading } = useModels()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, sortOrder: 0, maxInputTokens: 300, outputThrottleSteps: [], allowedModels: [] })
    setOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditing(plan)
    form.setFieldsValue({
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      dailyFreeTokens: plan.dailyFreeTokens,
      monthlyTotalTokens: plan.monthlyTotalTokens,
      allowedModels: plan.allowedModels,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      dailyMessageLimit: plan.dailyMessageLimit ?? null,
      throttledMessageCount: plan.throttledMessageCount ?? null,
      throttledInputTokens: plan.throttledInputTokens ?? null,
      throttledOutputTokens: plan.throttledOutputTokens ?? null,
      maxInputTokens: plan.maxInputTokens ?? null,
      outputThrottleSteps: (plan.outputThrottleSteps as ThrottleStepValue[] | null) ?? [],
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const payload = {
        name: values.name,
        priceMonthly: values.priceMonthly,
        dailyFreeTokens: values.dailyFreeTokens,
        monthlyTotalTokens: values.monthlyTotalTokens,
        allowedModels: values.allowedModels,
        features: {},
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        dailyMessageLimit: values.dailyMessageLimit ?? null,
        throttledMessageCount: values.throttledMessageCount ?? null,
        throttledInputTokens: values.throttledInputTokens ?? null,
        throttledOutputTokens: values.throttledOutputTokens ?? null,
        maxInputTokens: values.maxInputTokens ?? 300,
        outputThrottleSteps: (values.outputThrottleSteps ?? []).filter(s => s?.afterMessages && s?.maxOutputTokens),
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
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
                label: `${m.displayName} (${m.name})`,
              }))}
            />
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

          <Form.Item name="isActive" label={fa.plans.active} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
