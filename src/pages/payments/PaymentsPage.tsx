import { Card, Col, Row, Statistic, Spin, Alert, Typography } from 'antd'
import { DollarOutlined, RiseOutlined } from '@ant-design/icons'
import { useDashboardStats } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography

export function PaymentsPage() {
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
        {fa.payments.title}
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={fa.dashboard.totalRevenue}
              value={Math.round(data.totalRevenue / 10)}
              suffix={fa.common.toman}
              prefix={<DollarOutlined style={{ color: '#f59e0b', marginLeft: 8 }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={fa.dashboard.mrr}
              value={Math.round(data.mrr / 10)}
              suffix={fa.common.toman}
              prefix={<RiseOutlined style={{ color: '#8b5cf6', marginLeft: 8 }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 24 }}>
        <Text type="secondary">{fa.payments.nextPhase}</Text>
      </Card>
    </div>
  )
}
