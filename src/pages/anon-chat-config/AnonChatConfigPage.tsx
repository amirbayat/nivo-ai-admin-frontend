import { useEffect } from 'react'
import { AutoComplete, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Select, Spin, Switch, Typography, message } from 'antd'
import { useAnonChatConfig, useUpdateAnonChatConfig } from '@/queries/anon-chat-config.queries'
import { useModels } from '@/queries/admin.queries'
import type { AnonymousChatConfig } from '@/types/api'

const { Title, Text, Paragraph } = Typography

type FormValues = Omit<AnonymousChatConfig, 'id' | 'updatedAt'>

export function AnonChatConfigPage() {
  const { data: config, isLoading } = useAnonChatConfig()
  const { data: models } = useModels()
  const update = useUpdateAnonChatConfig()
  const [form] = Form.useForm<FormValues>()

  const signupBannerMessage = Form.useWatch('signupBannerMessage', form)
  const limitedZoneMessage = Form.useWatch('limitedZoneMessage', form)
  const blockedMessage = Form.useWatch('blockedMessage', form)
  const hintTitle = Form.useWatch('hintTitle', form)
  const hintSubtitle = Form.useWatch('hintSubtitle', form)

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  const modelOptions = (models ?? [])
    .filter((m) => m.modelType === 'CHAT')
    .map((m) => ({ value: m.name, label: `${m.displayName} (${m.name})` }))

  function handleFinish(values: FormValues) {
    update.mutate(values, {
      onSuccess: () => void message.success('تنظیمات ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>تنظیمات چت بدون لاگین (anonymous)</Title>
      <Paragraph type="secondary" style={{ marginBottom: 16, maxWidth: 700 }}>
        کاربرانی که هنوز ثبت‌نام/ورود نکرده‌اند می‌توانند با یک کوتای محدود (بر اساس IP) چت کنند — این صفحه محدودیت‌ها
        و پیام‌های راهنما/هشدار نمایش‌داده‌شده به آن‌ها را تنظیم می‌کند.
      </Paragraph>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card style={{ maxWidth: 640 }}>
            <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={config}>
              <Form.Item name="enabled" label="فعال بودن چت بدون لاگین" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                name="defaultModel"
                label="مدل پیش‌فرض"
                extra="مدلی که برای پاسخ به کاربران ناشناس استفاده می‌شود."
                rules={[{ required: true, message: 'مدل را وارد کن' }]}
              >
                <AutoComplete options={modelOptions} placeholder="مثلاً openai/gpt-4o-mini" />
              </Form.Item>

              <Form.Item
                name="reasoningEffort"
                label="میزان reasoning"
                extra="چت رایگان فاز فکرکردن مدل را به کاربر نمایش نمی‌دهد؛ برای مدل‌های reasoning بهتر است این پایین نگه داشته شود تا زمان و توکن خروجی صرف استدلال نامرئی نشود. خالی = پیش‌فرض provider."
              >
                <Select
                  allowClear
                  placeholder="پیش‌فرض provider"
                  options={[
                    { value: 'minimal', label: 'حداقل' },
                    { value: 'low', label: 'کم' },
                    { value: 'medium', label: 'متوسط' },
                    { value: 'high', label: 'بالا' },
                  ]}
                />
              </Form.Item>

              <Divider>محدودیت‌ها</Divider>

              <Form.Item
                name="freeMessageLimit"
                label="سقف پیام رایگان (کل عمر)"
                extra="تعداد پیامی که کاربر ناشناس بدون هیچ محدودیت روزانه‌ای می‌تواند ارسال کند؛ بعد از این وارد «ناحیه‌ی محدود» می‌شود."
                rules={[{ required: true }]}
              >
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="dailyMessageLimitAfterFree"
                label="سقف پیام روزانه (ناحیه‌ی محدود)"
                extra="بعد از اتمام کوتای رایگان، هر روز این تعداد پیام مجاز است."
                rules={[{ required: true }]}
              >
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="maxInputTokens" label="حداکثر توکن ورودی هر پیام" rules={[{ required: true }]}>
                <InputNumber min={1} step={50} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="maxOutputTokens" label="حداکثر توکن خروجی هر پاسخ" rules={[{ required: true }]}>
                <InputNumber min={1} step={50} style={{ width: '100%' }} />
              </Form.Item>

              <Divider>پیام‌های نمایشی به کاربر ناشناس</Divider>

              <Form.Item
                name="signupBannerMessage"
                label="متن بنر همیشگی (تشویق به ثبت‌نام)"
                extra="همیشه (حتی قبل از رسیدن به هیچ محدودیتی) به‌صورت یک بنر ملایم نمایش داده می‌شود."
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item
                name="limitedZoneMessage"
                label="پیام ورود به ناحیه‌ی محدود"
                extra="وقتی کوتای رایگان تمام شود ولی هنوز اجازه‌ی چت روزانه دارد نشان داده می‌شود."
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item
                name="blockedMessage"
                label="پیام مسدود شدن"
                extra="وقتی سقف روزانه هم تمام شود و ورودی چت غیرفعال شود نشان داده می‌شود."
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>

              <Divider>راهنمای وسط صفحه‌ی خالی چت</Divider>

              <Form.Item name="hintTitle" label="عنوان راهنما" rules={[{ required: true }]}>
                <Input />
              </Form.Item>

              <Form.Item name="hintSubtitle" label="زیرعنوان راهنما" rules={[{ required: true }]}>
                <Input />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={update.isPending}>
                ذخیره تنظیمات
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="پیش‌نمایش" style={{ maxWidth: 480 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>راهنمای وسط صفحه‌ی خالی چت</Text>
            <div
              style={{
                marginTop: 8,
                marginBottom: 16,
                padding: 16,
                borderRadius: 8,
                border: '1px dashed #d9d9d9',
                textAlign: 'center',
              }}
            >
              <Text strong style={{ display: 'block', fontSize: 15 }}>{hintTitle || '—'}</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>{hintSubtitle || '—'}</Text>
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>بنر همیشگی</Text>
            <div
              style={{
                marginTop: 8,
                marginBottom: 16,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#e6f4ff',
                border: '1px solid #91caff',
                fontSize: 13,
              }}
            >
              {signupBannerMessage || '—'}
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>پیام ناحیه‌ی محدود</Text>
            <div
              style={{
                marginTop: 8,
                marginBottom: 16,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                fontSize: 13,
              }}
            >
              {limitedZoneMessage || '—'}
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>پیام مسدود شدن</Text>
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                fontSize: 13,
              }}
            >
              {blockedMessage || '—'}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
