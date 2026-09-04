import { useEffect } from 'react'
import { Button, Card, Form, InputNumber, Spin, Switch, Typography, message } from 'antd'
import { useVideoStudioConfig, useUpdateVideoStudioConfig } from '@/queries/video-studio-config.queries'

const { Title, Text } = Typography

interface VideoStudioConfigFormValues {
  characterOptionCount: number
  maxCharacterRegeneratesPerProject: number
  maxConcurrentVideoJobsPerUser: number
  maxVideoGenPerDayPerUser: number | null
  defaultAudioEnabled: boolean
}

// docs/PRD-video-studio-chat-flow.md — تنظیمات ادمین‌محور استودیوی ویدیو، دقیقاً هم‌الگوی
// ChatConfigPage.tsx (antd Form + InputNumber/Switch + useQuery/useMutation)
export function VideoStudioConfigPage() {
  const { data: config, isLoading } = useVideoStudioConfig()
  const update = useUpdateVideoStudioConfig()
  const [form] = Form.useForm<VideoStudioConfigFormValues>()

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  function handleSave(values: VideoStudioConfigFormValues) {
    update.mutate(
      {
        ...values,
        // null صریح یعنی «بدون سقف روزانه» — InputNumber مقدار خالی را undefined می‌دهد، نه
        // null؛ باید صراحتاً به null تبدیل شود وگرنه بک‌اند به‌جای برداشتن سقف، آن را نادیده می‌گیرد
        maxVideoGenPerDayPerUser: values.maxVideoGenPerDayPerUser ?? null,
      },
      {
        onSuccess: () => void message.success('تنظیمات استودیوی ویدیو ذخیره شد'),
        onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      },
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>تنظیمات استودیوی ویدیو</Title>

      <Card title="محدودیت‌های تولید" style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={config}>
          <Form.Item
            name="characterOptionCount"
            label="تعداد گزینه‌ی طرح کاراکتر"
            extra="در هر بار «ساخت طرح‌های کاراکتر» یا «بازطراحی»، این تعداد عکس هم‌زمان تولید می‌شود (طراحی تأییدشده: ۴). هزینه‌ی هر این‌تعداد عکس از کاربر کسر می‌شود، نه فقط عکس نهایی‌انتخاب‌شده."
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={8} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxCharacterRegeneratesPerProject"
            label="حداکثر تعداد «بازطراحی کاراکتر» در هر پروژه"
            extra="سقفی روی دکمه‌ی «بازطراحی کن» — بعد از این تعداد، کاربر باید با همان گزینه‌های موجود ادامه دهد."
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxConcurrentVideoJobsPerUser"
            label="حداکثر جاب ویدیوی هم‌زمان هر کاربر"
            extra="تعداد صحنه‌هایی که یک کاربر می‌تواند هم‌زمان در حال رندر داشته باشد."
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxVideoGenPerDayPerUser"
            label="حداکثر تعداد ساخت ویدیو در روز، هر کاربر"
            extra="خالی بگذار یعنی بدون سقف روزانه."
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="defaultAudioEnabled"
            label="صدا/موسیقی به‌صورت پیش‌فرض روشن باشد"
            valuePropName="checked"
            extra="مقدار پیش‌فرض فیلد audioEnabled صحنه‌های تازه‌ساخته‌شده؛ کاربر می‌تواند برای هر صحنه جدا تغییرش دهد."
          >
            <Switch />
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
