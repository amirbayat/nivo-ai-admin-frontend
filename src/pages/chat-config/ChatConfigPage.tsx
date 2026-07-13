import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, InputNumber, Spin, Typography, message } from 'antd'
import { useChatConfig, useUpdateChatConfig } from '@/queries/chat-config.queries'
import { ContextEditor } from '@/pages/sales-bot/ContextEditor'

const { Title, Text } = Typography

interface ThresholdFormValues {
  summaryTriggerTokens: number
  summaryMaxTokens: number
}

export function ChatConfigPage() {
  const { data: config, isLoading } = useChatConfig()
  const update = useUpdateChatConfig()
  const [draft, setDraft] = useState<string | null>(null)
  const [form] = Form.useForm<ThresholdFormValues>()

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  function handleSaveContext() {
    if (draft === null) return
    update.mutate({ globalContextMd: draft }, {
      onSuccess: () => void message.success('کانتکست عمومی ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  function handleSaveThresholds(values: ThresholdFormValues) {
    update.mutate(values, {
      onSuccess: () => void message.success('تنظیمات خلاصه‌سازی ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>تنظیمات چت</Title>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="این متن به‌عنوان بخشی از system prompt همه‌ی مکالمات چت اصلی استفاده می‌شود."
        description="اگر پلن کاربر هم context اختصاصی داشته باشد (صفحه‌ی پلن‌ها)، بعد از همین متن اضافه می‌شود. تغییرات حداکثر تا ۶۰ ثانیه بعد روی پیام‌های جدید اعمال می‌شود."
      />
      <ContextEditor initialValue={config.globalContextMd} onChange={setDraft} />
      <div style={{ marginTop: 16, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button type="primary" onClick={handleSaveContext} loading={update.isPending} disabled={draft === null}>
          ذخیره کانتکست عمومی
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          آخرین ذخیره: {new Date(config.updatedAt).toLocaleString('fa-IR')}
        </Text>
      </div>

      <Card title="خلاصه‌سازی مبتنی بر توکن" style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical" onFinish={handleSaveThresholds} initialValues={config}>
          <Form.Item
            name="summaryTriggerTokens"
            label="آستانه‌ی خلاصه‌سازی (توکن)"
            extra="وقتی تاریخچه‌ی مکالمه از آخرین خلاصه‌سازی به این تعداد توکن برسد، دوباره خلاصه می‌شود."
            rules={[{ required: true }]}
          >
            <InputNumber min={100} max={100_000} step={500} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="summaryMaxTokens"
            label="حداکثر طول خلاصه (توکن)"
            extra="خروجی خلاصه‌ساز کوتاه نگه داشته می‌شود؛ عدد بالاتر یعنی خلاصه‌ی مفصل‌تر (و هزینه‌ی بیشتر)."
            rules={[{ required: true }]}
          >
            <InputNumber min={50} max={4096} step={50} style={{ width: '100%' }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={update.isPending}>
            ذخیره تنظیمات
          </Button>
        </Form>
      </Card>
    </div>
  )
}
