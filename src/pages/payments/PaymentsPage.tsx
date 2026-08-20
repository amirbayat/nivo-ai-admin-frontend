import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Space, DatePicker, Table } from 'antd'
import { DollarOutlined, RiseOutlined, WalletOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CreditsReportPackageRow, CreditsReportPromptRow } from '@/types/api'
import { useDashboardStats } from '@/queries/admin.queries'
import { useCreditsReport } from '@/queries/credits-report.queries'
import { useCreditPackages } from '@/queries/credit-config.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography
const { RangePicker } = DatePicker

function toman(v: number): string {
  return Math.round(v).toLocaleString('fa-IR')
}

// docs/PRD-admin-credit-reports.md فاز ۵ — قبلاً این صفحه فقط دو کارت از useDashboardStats
// (totalRevenue/mrr) نشان می‌داد و متن «جزئیات تراکنش‌ها در فاز بعدی» — حالا از
// GET /admin/creative/credits-report گزارش واقعی خرید/مصرف نیوو می‌آید
export function PaymentsPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()])
  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data, isLoading, isError } = useDashboardStats()
  const { data: report, isLoading: reportLoading } = useCreditsReport(from, to)
  const { data: packages } = useCreditPackages()

  const packageLabel = (row: CreditsReportPackageRow): string => {
    if (row.isCustomAmount) return fa.payments.customAmountPackage
    const pkg = packages?.find((p) => p.id === row.packageId)
    return pkg ? `بسته‌ی ${pkg.credits.toLocaleString('fa-IR')} نیوو` : row.packageId
  }

  const packageColumns: ColumnsType<CreditsReportPackageRow> = [
    { title: fa.payments.plan, key: 'package', render: (_, r) => packageLabel(r) },
    { title: fa.payments.transactions, dataIndex: 'transactions', key: 'transactions' },
    { title: fa.payments.credits, dataIndex: 'credits', key: 'credits', render: (v: number) => v.toLocaleString('fa-IR') },
    { title: fa.payments.amount, dataIndex: 'toman', key: 'toman', render: (v: number) => `${toman(v)} ${fa.dashboard.toman}` },
  ]

  const promptColumns: ColumnsType<CreditsReportPromptRow> = [
    { title: 'سبک', dataIndex: 'title', key: 'title' },
    { title: fa.payments.generations, dataIndex: 'generations', key: 'generations' },
    { title: fa.payments.credits, dataIndex: 'creditCost', key: 'creditCost', render: (v: number) => v.toLocaleString('fa-IR') },
    { title: 'هزینه‌ی واقعی AI (ت)', dataIndex: 'costToman', key: 'costToman', render: (v: number) => toman(v) },
  ]

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>
          {fa.payments.title}
        </Title>
        <RangePicker value={range} onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])} allowClear={false} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={fa.dashboard.totalRevenue}
              value={data.totalRevenue}
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
              value={data.mrr}
              suffix={fa.common.toman}
              prefix={<RiseOutlined style={{ color: '#8b5cf6', marginLeft: 8 }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
        {fa.payments.creditsReportTitle}
      </Title>

      {reportLoading || !report ? (
        <Spin />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={fa.payments.soldTitle}
                  value={report.sold.totalCredits}
                  suffix="نیوو"
                  prefix={<ThunderboltOutlined style={{ color: '#22c55e', marginLeft: 8 }} />}
                  valueStyle={{ color: '#22c55e' }}
                />
                <Space size={4} style={{ fontSize: 12, color: '#94a3b8' }}>
                  {toman(report.sold.totalToman)} {fa.common.toman} — {report.sold.totalTransactions.toLocaleString('fa-IR')} تراکنش
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={fa.payments.consumedTitle}
                  value={report.consumed.totalCreditCost}
                  suffix="نیوو"
                  prefix={<ThunderboltOutlined style={{ color: '#ef4444', marginLeft: 8 }} />}
                  valueStyle={{ color: '#ef4444' }}
                />
                <Space size={4} style={{ fontSize: 12, color: '#94a3b8' }}>
                  {report.consumed.totalGenerations.toLocaleString('fa-IR')} تولید — هزینه‌ی واقعی {toman(report.consumed.totalCostToman)} {fa.common.toman}
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={fa.payments.outstandingTitle}
                  value={report.outstanding.credits}
                  suffix="نیوو"
                  prefix={<WalletOutlined style={{ color: '#8b5cf6', marginLeft: 8 }} />}
                  valueStyle={{ color: '#8b5cf6' }}
                />
                <Space size={4} style={{ fontSize: 12, color: '#94a3b8' }}>
                  {toman(report.outstanding.balanceToman)} {fa.common.toman} — همه‌ی کاربران، بدون فیلتر بازه
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={fa.payments.marginTitle}
                  value={report.margin.marginToman}
                  suffix={fa.common.toman}
                  valueStyle={{ color: report.margin.marginToman < 0 ? '#ef4444' : '#10b981' }}
                />
                <Space size={4} style={{ fontSize: 12, color: '#94a3b8' }}>
                  درآمد {toman(report.margin.revenueToman)} − هزینه {toman(report.margin.costToman)}
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title={fa.payments.byPackageTitle} size="small">
                <Table<CreditsReportPackageRow>
                  rowKey="packageId"
                  dataSource={report.sold.byPackage}
                  columns={packageColumns}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: fa.common.noData }}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={fa.payments.byPromptTitle} size="small">
                <Table<CreditsReportPromptRow>
                  rowKey="promptId"
                  dataSource={report.consumed.byPrompt}
                  columns={promptColumns}
                  pagination={false}
                  size="small"
                  locale={{ emptyText: fa.common.noData }}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
