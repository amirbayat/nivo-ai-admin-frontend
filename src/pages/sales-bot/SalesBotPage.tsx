import { Tabs, Typography } from 'antd'
import { ContextTab } from './ContextTab'
import { ModelSettingsTab } from './ModelSettingsTab'
import { AnalyticsTab } from './AnalyticsTab'
import { LeadsTab } from './LeadsTab'
import { KnowledgeBaseTab } from './KnowledgeBaseTab'
import { HistoryTab } from './HistoryTab'

const { Title } = Typography

export function SalesBotPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>ربات فروش</Title>
      <Tabs
        defaultActiveKey="context"
        items={[
          { key: 'context', label: 'کانتکست', children: <ContextTab /> },
          { key: 'kb', label: 'پایگاه دانش', children: <KnowledgeBaseTab /> },
          { key: 'model', label: 'مدل و تنظیمات', children: <ModelSettingsTab /> },
          { key: 'analytics', label: 'آنالیتیکس', children: <AnalyticsTab /> },
          { key: 'leads', label: 'لیدها', children: <LeadsTab /> },
          { key: 'history', label: 'تاریخچه', children: <HistoryTab /> },
        ]}
      />
    </div>
  )
}
