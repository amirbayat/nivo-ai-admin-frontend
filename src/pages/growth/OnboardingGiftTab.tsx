import { useEffect } from 'react'
import { Alert, Button, Card, Form, Input, Spin, Switch, message } from 'antd'
import { useOnboardingGift, useUpdateOnboardingGift } from '@/queries/growth.queries'

const { TextArea } = Input

interface FormValues {
  title: string
  description: string
  audioUrl: string | null
  isActive: boolean
}

export function OnboardingGiftTab() {
  const { data: gift, isLoading } = useOnboardingGift()
  const update = useUpdateOnboardingGift()
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (gift) form.setFieldsValue(gift)
  }, [gift, form])

  if (isLoading || !gift) return <Spin />

  function handleFinish(values: FormValues) {
    update.mutate(values, {
      onSuccess: () => void message.success('ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  return (
    <Card style={{ maxWidth: 600 }}>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="این هدیه به کاربران رایگانِ داخل دوره‌ی آزمایشی (صفحه‌ی پلن‌ها) نشان داده می‌شود."
        description="فایل صوتی را خودت جایی آپلود کن (هر فضای ذخیره‌سازی/CDN) و فقط لینکش را اینجا بگذار — آپلود مستقیم از این پنل فعلاً پشتیبانی نمی‌شود."
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={gift}>
        <Form.Item name="title" label="عنوان" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="توضیح">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="audioUrl"
          label="لینک فایل صوتی"
          extra="آدرس کامل فایل mp3 که قبلاً یه‌جا آپلود کرده‌ای"
        >
          <Input placeholder="https://..." style={{ direction: 'ltr' }} />
        </Form.Item>
        <Form.Item name="isActive" label="فعال (به کاربران واجدشرایط نشان داده شود)" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={update.isPending}>
          ذخیره
        </Button>
      </Form>
    </Card>
  )
}
