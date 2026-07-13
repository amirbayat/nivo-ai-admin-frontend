import { useEffect } from 'react'
import { Button, Card, Divider, Form, InputNumber, Spin, message } from 'antd'
import { useGrowthConfig, useUpdateGrowthConfig } from '@/queries/growth.queries'

interface FormValues {
  welcomeDiscountPercent: number
  welcomeDiscountValidHours: number
  expiryDiscountPercent: number
  referralDiscountPercent: number
  referralDiscountValidDays: number
}

export function GrowthConfigTab() {
  const { data: config, isLoading } = useGrowthConfig()
  const update = useUpdateGrowthConfig()
  const [form] = Form.useForm<FormValues>()

  useEffect(() => {
    if (config) form.setFieldsValue(config)
  }, [config, form])

  if (isLoading || !config) return <Spin />

  function handleFinish(values: FormValues) {
    update.mutate(values, {
      onSuccess: () => void message.success('ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  return (
    <Card style={{ maxWidth: 560 }}>
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={config}>
        <Divider orientation="right" style={{ fontSize: 13 }}>🎁 هدیه‌ی خوش‌آمد</Divider>
        <Form.Item name="welcomeDiscountPercent" label="درصد تخفیف" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} addonAfter="٪" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="welcomeDiscountValidHours" label="مدت اعتبار (ساعت)" rules={[{ required: true }]}>
          <InputNumber min={1} max={720} addonAfter="ساعت" style={{ width: '100%' }} />
        </Form.Item>

        <Divider orientation="right" style={{ fontSize: 13 }}>⏰ هشدار انقضای اشتراک</Divider>
        <Form.Item name="expiryDiscountPercent" label="درصد تخفیف" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} addonAfter="٪" style={{ width: '100%' }} />
        </Form.Item>

        <Divider orientation="right" style={{ fontSize: 13 }}>🤝 معرفی دوستان</Divider>
        <Form.Item name="referralDiscountPercent" label="درصد تخفیف (هر دو طرف)" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} addonAfter="٪" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="referralDiscountValidDays" label="مدت اعتبار (روز)" rules={[{ required: true }]}>
          <InputNumber min={1} max={365} addonAfter="روز" style={{ width: '100%' }} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={update.isPending}>
          ذخیره
        </Button>
      </Form>
    </Card>
  )
}
