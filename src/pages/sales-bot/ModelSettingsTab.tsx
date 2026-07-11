import { useEffect } from 'react'
import { AutoComplete, Button, Card, Form, Input, InputNumber, Spin, Switch, message } from 'antd'
import { useModels } from '@/queries/admin.queries'
import { useSalesBotConfig, useUpdateSalesBotConfig } from '@/queries/sales-bot.queries'

interface FormValues {
  model: string
  embeddingModel: string
  maxOutputTokens: number
  maxMessages: number
  discountEnabled: boolean
  discountMinMessages: number
  discountPromptText: string
}

export function ModelSettingsTab() {
  const { data: config, isLoading } = useSalesBotConfig()
  const { data: models } = useModels()
  const update = useUpdateSalesBotConfig()
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  function handleFinish(values: FormValues) {
    update.mutate(values, {
      onSuccess: () => void message.success('تنظیمات ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  const modelOptions = (models ?? [])
    .filter((m) => m.modelType === 'CHAT')
    .map((m) => ({ value: m.name, label: `${m.displayName} (${m.name})` }))
  const embeddingModelOptions = (models ?? [])
    .filter((m) => m.modelType === 'EMBEDDING')
    .map((m) => ({ value: m.name, label: `${m.displayName} (${m.name})` }))

  return (
    <Card style={{ maxWidth: 560 }}>
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={config}>
        <Form.Item
          name="model"
          label="مدل"
          extra="شناسه‌ی دقیق مدل باید در کاتالوگ provider (مثلاً Liara) موجود باشد — اگر در جدول «مدل‌ها» ثبت نشده باشد، هزینه با قیمت پیش‌فرض محاسبه می‌شود."
          rules={[{ required: true, message: 'مدل را وارد کن' }]}
        >
          <AutoComplete options={modelOptions} placeholder="مثلاً openai/gpt-5.4-mini" />
        </Form.Item>

        <Form.Item
          name="embeddingModel"
          label="مدل Embedding (برای پایگاه دانش)"
          extra="بعد از تغییر این مدل، حتماً از تب «پایگاه دانش» دکمه‌ی «بازمحاسبه‌ی همه‌ی embedding‌ها» را بزنید — وگرنه نمونه‌های قدیمی با مدل جدید قابل مقایسه نیستند."
          rules={[{ required: true, message: 'مدل embedding را انتخاب کن' }]}
        >
          <AutoComplete options={embeddingModelOptions} placeholder="مثلاً openai/text-embedding-3-small" />
        </Form.Item>

        <Form.Item
          name="maxOutputTokens"
          label="حداکثر توکن خروجی هر پاسخ"
          extra="قبلاً در کد ثابت روی ۴۰۰ بود؛ الان از همین‌جا قابل تنظیم است. عدد بالاتر یعنی پاسخ‌های بالقوه طولانی‌تر (و هزینه‌ی بیشتر)."
          rules={[{ required: true }]}
        >
          <InputNumber min={50} max={4096} step={50} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="maxMessages" label="حداکثر پیام هر مکالمه" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="discountEnabled" label="پیشنهاد تخفیف فعال باشد" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item
          name="discountMinMessages"
          label="حداقل تعداد پیام قبل از پیشنهاد تخفیف"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="discountPromptText" label="متن پیشنهاد تخفیف" rules={[{ required: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={update.isPending}>
          ذخیره
        </Button>
      </Form>
    </Card>
  )
}
