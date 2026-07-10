import { useState } from 'react'
import { Alert, Button, Spin, Typography, message } from 'antd'
import { useSalesBotConfig, useUpdateSalesBotConfig } from '@/queries/sales-bot.queries'
import { ContextEditor } from './ContextEditor'

const { Text } = Typography

export function ContextTab() {
  const { data: config, isLoading } = useSalesBotConfig()
  const update = useUpdateSalesBotConfig()
  const [draft, setDraft] = useState<string | null>(null)

  if (isLoading || !config) return <Spin />

  function handleSave() {
    if (draft === null) return
    update.mutate({ contextMd: draft }, {
      onSuccess: () => void message.success('کانتکست ذخیره شد'),
      onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
    })
  }

  return (
    <div>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="این متن دقیقاً همان system prompt ای است که به مدل ربات فروش داده می‌شود."
        description="خروجی ادیتور به‌صورت Markdown ذخیره می‌شود. تغییرات حداکثر تا ۶۰ ثانیه بعد روی مکالمات جدید اعمال می‌شود."
      />
      <ContextEditor initialValue={config.contextMd} onChange={setDraft} />
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button type="primary" onClick={handleSave} loading={update.isPending} disabled={draft === null}>
          ذخیره
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          آخرین ذخیره: {new Date(config.updatedAt).toLocaleString('fa-IR')}
        </Text>
      </div>
    </div>
  )
}
