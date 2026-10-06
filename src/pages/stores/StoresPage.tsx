import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Button, Card, DatePicker, Input, Space, Switch, Table, Tag, Tooltip, Typography, message } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useSetStoreLeadCaptureOnly, useStoreCreditOverview } from '@/queries/store-credit.queries'
import type { StoreCreditOverviewItem } from '@/types/api'
import { fa } from '@/locales/fa'
import { StoreCreditUsageDrawer } from './StoreCreditUsageDrawer'

const { Title } = Typography
const { Search } = Input
const { RangePicker } = DatePicker

function costByKindTooltip(item: StoreCreditOverviewItem): string {
  const entries = Object.entries(item.costByKind).filter(([, v]) => (v ?? 0) > 0)
  if (!entries.length) return '—'
  return entries
    .map(([kind, v]) => `${fa.stores.kindLabels[kind] ?? kind}: ${(v ?? 0).toLocaleString('fa-IR')}`)
    .join(' / ')
}

// docs/PRD-admin-seller-credit-overview.md بخش ۴ — صفحه‌ی لیست فروشنده‌ها با اعتبار/هزینه‌ی AI
export function StoresPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)
  const [detail, setDetail] = useState<{ storeId: string; storeName: string } | null>(null)

  const { data, isLoading } = useStoreCreditOverview({
    page,
    search,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })
  const setLeadCaptureOnly = useSetStoreLeadCaptureOnly()

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  const columns: ColumnsType<StoreCreditOverviewItem> = [
    {
      title: fa.stores.store,
      key: 'store',
      width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.name}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.slug}</span>
        </Space>
      ),
    },
    {
      title: fa.stores.seller,
      key: 'seller',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.seller.name ?? '—'}</span>
          <span dir="ltr" style={{ fontSize: 12, color: '#94a3b8' }}>
            {r.seller.phone}
          </span>
        </Space>
      ),
    },
    {
      title: fa.stores.status,
      dataIndex: 'status',
      width: 90,
      render: (v: StoreCreditOverviewItem['status']) => (
        <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>
          {v === 'ACTIVE' ? fa.stores.statusActive : fa.stores.statusSuspended}
        </Tag>
      ),
    },
    {
      title: fa.stores.creditBalance,
      dataIndex: 'creditBalanceToman',
      width: 120,
      render: (v: number) => `${v.toLocaleString('fa-IR')} ت`,
    },
    {
      title: fa.stores.trialCredit,
      dataIndex: 'trialCreditRemainingToman',
      width: 110,
      render: (v: number) => (v > 0 ? `${v.toLocaleString('fa-IR')} ت` : '—'),
    },
    {
      title: fa.stores.totalPurchased,
      dataIndex: 'totalPurchasedToman',
      width: 120,
      render: (v: number) => `${v.toLocaleString('fa-IR')} ت`,
    },
    {
      title: (
        <Space size={4}>
          {fa.stores.totalAiCost}
          <Tooltip title={fa.stores.totalAiCostHint}>
            <QuestionCircleOutlined style={{ color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      key: 'totalAiCost',
      width: 130,
      render: (_, r) => (
        <Tooltip title={costByKindTooltip(r)}>
          <span>{r.totalAiCostToman.toLocaleString('fa-IR')} ت</span>
        </Tooltip>
      ),
    },
    {
      title: fa.stores.totalCharged,
      dataIndex: 'totalChargedToman',
      width: 120,
      render: (v: number) => `${v.toLocaleString('fa-IR')} ت`,
    },
    {
      title: fa.stores.freeVsPaid,
      key: 'freeVsPaid',
      width: 110,
      render: (_, r) => `${r.freeQuotaEventsCount.toLocaleString('fa-IR')} / ${r.paidEventsCount.toLocaleString('fa-IR')}`,
    },
    {
      title: (
        <Space size={4}>
          {fa.stores.leadCaptureOnly}
          <Tooltip title={fa.stores.leadCaptureOnlyHint}>
            <QuestionCircleOutlined style={{ color: '#888' }} />
          </Tooltip>
        </Space>
      ),
      key: 'leadCaptureOnly',
      width: 130,
      render: (_, r) => (
        <Switch
          checked={r.leadCaptureOnly}
          loading={setLeadCaptureOnly.isPending && setLeadCaptureOnly.variables?.storeId === r.storeId}
          onChange={(checked) =>
            setLeadCaptureOnly.mutate(
              { storeId: r.storeId, enabled: checked },
              { onError: () => void message.error(fa.common.error) },
            )
          }
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_, r) => (
        <Button size="small" onClick={() => setDetail({ storeId: r.storeId, storeName: r.name })}>
          {fa.stores.viewUsage}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.stores.title}
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder={fa.stores.search}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          allowClear
          style={{ width: 280 }}
          enterButton
        />
        <RangePicker
          value={range}
          onChange={(v) => {
            setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
            setPage(1)
          }}
        />
      </Space>

      <Card>
        <Table<StoreCreditOverviewItem>
          rowKey="storeId"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          scroll={{ x: 1430 }}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: data?.pageSize ?? 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <StoreCreditUsageDrawer
        storeId={detail?.storeId ?? null}
        storeName={detail?.storeName ?? ''}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
