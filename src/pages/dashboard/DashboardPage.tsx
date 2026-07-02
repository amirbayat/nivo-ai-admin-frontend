import { useState } from 'react'
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Segmented, Tag } from 'antd'
import {
  UserOutlined, TeamOutlined, DollarOutlined, RiseOutlined,
  MessageOutlined, CalendarOutlined, WarningOutlined,
} from '@ant-design/icons'
import { useDashboardStats, useCostChart, usePricingAlert } from '@/queries/admin.queries'
import type { CostChartPoint } from '@/types/api'
import { fa } from '@/locales/fa'

const { Title } = Typography

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

function CostChart({ data }: { data: CostChartPoint[]; days: number }) {
  if (!data.length) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>داده‌ای برای نمایش وجود ندارد</div>

  const W = 700, H = 200, PAD = { top: 20, right: 20, bottom: 40, left: 60 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.flatMap(d => [d.aiCostRial / 10, d.revenueToman]), 1)

  function x(i: number) { return PAD.left + (i / Math.max(data.length - 1, 1)) * plotW }
  function y(v: number) { return PAD.top + plotH - (v / maxVal) * plotH }

  const revenuePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.revenueToman).toFixed(1)}`).join(' ')
  const costPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.aiCostRial / 10).toFixed(1)}`).join(' ')

  const step = Math.ceil(data.length / 6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', direction: 'ltr' }}>
      {/* grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <g key={t}>
          <line x1={PAD.left} y1={y(maxVal * t)} x2={W - PAD.right} y2={y(maxVal * t)} stroke="#333" strokeDasharray="3,3" />
          <text x={PAD.left - 6} y={y(maxVal * t) + 4} fontSize={10} fill="#888" textAnchor="end">
            {Math.round(maxVal * t / 1000)}k
          </text>
        </g>
      ))}

      {/* revenue line */}
      <path d={revenuePath} fill="none" stroke="#10b981" strokeWidth={2} />
      {/* cost line */}
      <path d={costPath} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" />

      {/* x-axis labels */}
      {data.map((d, i) => i % step === 0 ? (
        <text key={i} x={x(i)} y={H - 8} fontSize={9} fill="#888" textAnchor="middle">
          {d.date.slice(5)}
        </text>
      ) : null)}

      {/* legend */}
      <line x1={W - 140} y1={15} x2={W - 120} y2={15} stroke="#10b981" strokeWidth={2} />
      <text x={W - 115} y={19} fontSize={10} fill="#10b981">درآمد (تومان)</text>
      <line x1={W - 140} y1={30} x2={W - 120} y2={30} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" />
      <text x={W - 115} y={34} fontSize={10} fill="#f59e0b">هزینه AI (تومان)</text>
    </svg>
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
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.totalRevenue} value={Math.round(data.totalRevenue / 10)} suffix={fa.dashboard.toman} icon={<DollarOutlined />} color="#f59e0b" /></Col>
        <Col xs={24} sm={12} lg={8}><StatCard title={fa.dashboard.mrr} value={Math.round(data.mrr / 10)} suffix={fa.dashboard.toman} icon={<RiseOutlined />} color="#8b5cf6" /></Col>
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
        {chartData ? <CostChart data={chartData} days={days} /> : <Spin />}
        {alert && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Tag color={alert.alertLevel === 'critical' ? 'red' : alert.alertLevel === 'warning' ? 'orange' : 'green'}>
              هزینه AI: {alert.aiCostRatio}٪ درآمد
            </Tag>
            <Tag>درآمد این ماه: {Math.round(alert.monthlyRevenueToman / 10).toLocaleString('fa-IR')} تومان</Tag>
            <Tag>هزینه AI: {Math.round(alert.monthlyAiCostRial / 10).toLocaleString('fa-IR')} تومان</Tag>
          </div>
        )}
      </Card>
    </div>
  )
}
