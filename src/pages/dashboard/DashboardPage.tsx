import { Card, Col, Row, Statistic, Spin, Alert, Typography } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  MessageOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useDashboardStats } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

function StatCard({
  title,
  value,
  suffix,
  icon,
  color,
}: {
  title: string
  value: number
  suffix?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={<span style={{ color, marginLeft: 8 }}>{icon}</span>}
        valueStyle={{ color }}
      />
    </Card>
  )
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError || !data) {
    return <Alert type="error" message={fa.common.error} />
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        {fa.dashboard.title}
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.totalUsers}
            value={data.totalUsers}
            icon={<UserOutlined />}
            color="#1677ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.activeUsers}
            value={data.activeUsers}
            icon={<TeamOutlined />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.totalRevenue}
            value={Math.round(data.totalRevenue / 10)}
            suffix={fa.dashboard.toman}
            icon={<DollarOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.mrr}
            value={Math.round(data.mrr / 10)}
            suffix={fa.dashboard.toman}
            icon={<RiseOutlined />}
            color="#8b5cf6"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.totalConversations}
            value={data.totalConversations}
            icon={<MessageOutlined />}
            color="#06b6d4"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title={fa.dashboard.todayConversations}
            value={data.todayConversations}
            icon={<CalendarOutlined />}
            color="#ef4444"
          />
        </Col>
      </Row>
    </div>
  )
}
