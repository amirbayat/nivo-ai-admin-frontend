import { useState } from 'react'
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Segmented, Tag, Space } from 'antd'
import {
  UserOutlined, TeamOutlined, DollarOutlined, RiseOutlined,
  MessageOutlined, CalendarOutlined, WarningOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useDashboardStats, useCostChart, usePricingAlert } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'
import { CostCanvasChart } from './CostCanvasChart'

const { Title, Text } = Typography

function StatCard({ title, value, suffix, icon, color }: {
  title: string; value: number; suffix?: string; icon: React.ReactNode; color: string
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
  const [days, setDays] = useState(30)
  const { data, isLoading, isError } = useDashboardStats()
  const { data: chartData } = useCostChart(days)
  const { data: alert } = usePricingAlert()

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
  if (isError || !data) return <Alert type="error" message={fa.common.error} />

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>{fa.dashboard.title}</Title>

      <Card style={{ marginBottom: 16 }} size="small">
        <Space wrap size={16}>
          <Space size={6}>
            <DollarOutlined style={{ color: '#f59e0b' }} />
            <Text strong>{fa.dashboard.exchangeRateTitle}:</Text>
            <Text>{Math.round(data.exchangeRate.toman).toLocaleString('fa-IR')} {fa.dashboard.toman}</Text>
          </Space>
          <Tag color={data.exchangeRate.source === 'live' ? 'green' : 'red'}>
            {data.exchangeRate.source === 'live' ? fa.dashboard.exchangeRateLive : fa.dashboard.exchangeRateFallback}
          </Tag>
          {data.exchangeRate.updatedAt && (
            <Space size={6}>
              <ClockCircleOutlined style={{ color: '#888' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {fa.dashboard.exchangeRateUpdatedAt}: {new Date(data.exchangeRate.updatedAt).toLocaleString('fa-IR')}
              </Text>
            </Space>
          )}
        </Space>
      </Card>

      {alert && alert.alertLevel !== 'safe' && (
        <Alert
          type={alert.alertLevel === 'critical' ? 'error' : 'warning'}
          icon={<WarningOutlined />}
          showIcon
          message={`هزینه AI: ${alert.aiCostRatio}٪ درآمد`}
          description={alert.suggestion}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.totalUsers} value={data.totalUsers} icon={<UserOutlined />} color="#1677ff" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.activeUsers} value={data.activeUsers} icon={<TeamOutlined />} color="#10b981" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.totalRevenue} value={data.totalRevenue} suffix={fa.dashboard.toman} icon={<DollarOutlined />} color="#f59e0b" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.mrr} value={data.mrr} suffix={fa.dashboard.toman} icon={<RiseOutlined />} color="#8b5cf6" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.totalConversations} value={data.totalConversations} icon={<MessageOutlined />} color="#06b6d4" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.todayConversations} value={data.todayConversations} icon={<CalendarOutlined />} color="#ef4444" /></Col>
      </Row>

      <Card
        style={{ marginTop: 24 }}
        title="درآمد در برابر هزینه AI"
        extra={
          <Segmented
            value={days}
            onChange={v => setDays(Number(v))}
            options={[{ label: '7 روز', value: 7 }, { label: '30 روز', value: 30 }, { label: '90 روز', value: 90 }]}
          />
        }
      >
        {chartData ? <CostCanvasChart data={chartData} /> : <Spin />}
        {alert && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Tag color={alert.alertLevel === 'critical' ? 'red' : alert.alertLevel === 'warning' ? 'orange' : 'green'}>
              هزینه AI: {alert.aiCostRatio}٪ درآمد
            </Tag>
            <Tag>درآمد این ماه: {alert.monthlyRevenueToman.toLocaleString('fa-IR')} تومان</Tag>
            <Tag>هزینه AI: {alert.monthlyAiCostToman.toLocaleString('fa-IR')} تومان (${alert.monthlyAiCostUsd.toFixed(2)})</Tag>
          </div>
        )}
      </Card>
    </div>
  )
}
