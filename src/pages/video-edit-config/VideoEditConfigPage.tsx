import { useEffect } from 'react'
import { Button, Card, Form, InputNumber, Spin, Switch, Typography, message } from 'antd'
import { useUpdateVideoEditConfig, useVideoEditConfig } from '@/queries/video-edit-config.queries'

const { Title, Text } = Typography

interface VideoEditConfigFormValues {
  isEnabled: boolean
  generateFixedDurationSec: number
  maxConcurrentJobsPerUser: number
  maxJobsPerDayPerUser: number | null
}

// docs/PRD-video-edit-omni-kie.md بخش ۷ — تنظیمات فیچر «ویرایش ویدیو» (Kie.ai)، کاملاً جدا
// از VideoStudioConfigPage.tsx — دقیقاً هم‌الگو (antd Form + InputNumber/Switch)
export function VideoEditConfigPage() {
  const { data: config, isLoading } = useVideoEditConfig()
  const update = useUpdateVideoEditConfig()
  const [form] = Form.useForm<VideoEditConfigFormValues>()

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  function handleSave(values: VideoEditConfigFormValues) {
    update.mutate(
      { ...values, maxJobsPerDayPerUser: values.maxJobsPerDayPerUser ?? null },
      {
        onSuccess: () => void message.success('تنظیمات ویرایش ویدیو ذخیره شد'),
        onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      },
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>تنظیمات ویرایش ویدیو (Kie.ai)</Title>

      <Card title="محدودیت‌های فیچر" style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={config}>
          <Form.Item name="isEnabled" label="فعال بودن فیچر" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="generateFixedDurationSec"
            label="مدت ثابت تولید ویدیو (ثانیه)"
            extra="فقط برای حالت «تولید» — وقتی ویدیوی مرجعی داده نشده باشد. مدت حالت «ادیت» همان مدت ویدیوی ورودی است."
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={30} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxConcurrentJobsPerUser"
            label="حداکثر جاب هم‌زمان هر کاربر"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxJobsPerDayPerUser"
            label="حداکثر تعداد جاب در روز، هر کاربر"
            extra="خالی بگذار یعنی بدون سقف روزانه."
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="primary" htmlType="submit" loading={update.isPending}>
              ذخیره تنظیمات
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              آخرین ذخیره: {new Date(config.updatedAt).toLocaleString('fa-IR')}
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  )
}
