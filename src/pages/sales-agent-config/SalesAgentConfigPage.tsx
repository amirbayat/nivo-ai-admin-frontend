import { useEffect } from 'react'
import { Card, Form, InputNumber, Space, Button, Typography, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useSalesAgentConfig, useUpdateSalesAgentConfig } from '@/queries/sales-agent-config.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

interface ConfigFormValues {
  freeDailyQuota: number
  trialDurationDays: number
  trialCreditToman: number
}

// docs/PRD-sales-agent-checkout-pricing-and-roadmap.md بخش ۶.۵ — سه عدد مارکت‌پلیس
// sales-agent، همون الگوی ساده‌ی بخش «تنظیمات نیوو» در CreditConfigPage.tsx (بدون جدول بسته)
export function SalesAgentConfigPage() {
  const [form] = Form.useForm<ConfigFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const { data: config, isLoading } = useSalesAgentConfig()
  const updateConfig = useUpdateSalesAgentConfig()

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        freeDailyQuota: config.freeDailyQuota,
        trialDurationDays: config.trialDurationDays,
        trialCreditToman: config.trialCreditToman,
      })
    }
  }, [config, form])

  function handleSave() {
    form.validateFields().then(values => {
      updateConfig.mutate(values, {
        onSuccess: () => void messageApi.success(fa.salesAgentConfig.configSaved),
        onError: () => void messageApi.error(fa.common.error),
      })
    })
  }

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ margin: '0 0 16px' }}>{fa.salesAgentConfig.title}</Title>

      <Card loading={isLoading}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Space size="large" wrap align="start">
            <Form.Item name="freeDailyQuota" label={fa.salesAgentConfig.freeDailyQuota} rules={[{ required: true }]} extra={fa.salesAgentConfig.freeDailyQuotaHint}>
              <InputNumber style={{ width: 280 }} min={1} step={1} />
            </Form.Item>
            <Form.Item name="trialDurationDays" label={fa.salesAgentConfig.trialDurationDays} rules={[{ required: true }]}>
              <InputNumber style={{ width: 220 }} min={1} step={1} />
            </Form.Item>
            <Form.Item name="trialCreditToman" label={fa.salesAgentConfig.trialCreditToman} rules={[{ required: true }]}>
              <InputNumber style={{ width: 240 }} min={0} step={10000} />
            </Form.Item>
          </Space>

          <Text type="secondary" style={{ display: 'block', margin: '4px 0 16px' }}>
            {fa.salesAgentConfig.trialHint}
          </Text>

          <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={updateConfig.isPending}>
            {fa.salesAgentConfig.saveConfig}
          </Button>
        </Form>
      </Card>
    </div>
  )
}
