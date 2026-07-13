import { Tabs, Typography } from 'antd'
import { OnboardingGiftTab } from './OnboardingGiftTab'
import { DiscountCodesTab } from './DiscountCodesTab'
import { GrowthConfigTab } from './GrowthConfigTab'

const { Title } = Typography

export function GrowthPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>رشد و بازاریابی</Title>
      <Tabs
        defaultActiveKey="gift"
        items={[
          { key: 'gift', label: 'هدیه‌ی خوش‌آمد', children: <OnboardingGiftTab /> },
          { key: 'codes', label: 'کدهای تخفیف', children: <DiscountCodesTab /> },
          { key: 'settings', label: 'درصد و مدت‌ها', children: <GrowthConfigTab /> },
        ]}
      />
    </div>
  )
}
