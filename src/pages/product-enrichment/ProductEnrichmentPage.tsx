import { useState } from 'react'
import { Card, Table, Button, Tag, Typography, Space, Select, message, Input, Drawer } from 'antd'
import { CheckOutlined, CloseOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { LowCompletenessProduct, ProductEnrichmentDraft } from '@/types/api'
import {
  useLowCompletenessProducts,
  useCreateEnrichmentDraft,
  useApproveEnrichmentDraft,
  useRejectEnrichmentDraft,
} from '@/queries/admin.queries'
import { useQaStores } from '@/queries/sales-agent-qa.queries'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLORS: Record<string, string> = {
  PENDING_ADMIN_REVIEW: 'gold',
  PENDING_SELLER_REVIEW: 'blue',
  SELLER_APPROVED: 'green',
  SELLER_REJECTED: 'red',
  ADMIN_REJECTED: 'default',
}

// docs/PRD-admin-product-enrichment-review.md — ادمین محصولات کم‌اطلاعات را enrich می‌کند
// (منبع دستی یا جستجوی وب)، خودش تایید می‌دهد، بعد فروشنده هم باید تایید بدهد
//
// docs/PRD-sales-agent-checkout-pricing-and-roadmap.md بخش ۳ (فاز ۴.۱) — ردیف قابل‌گسترش
// قبلی جایش را به یک Drawer تمام‌ارتفاع داده (همان تصمیم «مدال/Drawer تمام‌ارتفاع» که سمت
// فروشنده هم پیاده شد)؛ placement="left" چون Sider ادمین در RTL سمت راست پین شده است.
export function ProductEnrichmentPage() {
  const [page, setPage] = useState(1)
  const [storeFilter, setStoreFilter] = useState<string | undefined>(undefined)
  const [messageApi, contextHolder] = message.useMessage()
  const [resourceTextByProduct, setResourceTextByProduct] = useState<Record<string, string>>({})
  const [draftByProduct, setDraftByProduct] = useState<Record<string, ProductEnrichmentDraft>>({})
  const [activeProductId, setActiveProductId] = useState<string | null>(null)

  const { data: stores } = useQaStores()
  const { data, isLoading } = useLowCompletenessProducts(page, storeFilter)
  const createDraft = useCreateEnrichmentDraft()
  const approve = useApproveEnrichmentDraft()
  const reject = useRejectEnrichmentDraft()

  const activeRow = (data?.items ?? []).find(p => p.id === activeProductId) ?? null

  function generate(productId: string, source: 'WEB_SEARCH' | 'ADMIN_RESOURCE') {
    const resourceText = resourceTextByProduct[productId]?.trim()
    if (source === 'ADMIN_RESOURCE' && !resourceText) return
    createDraft.mutate(
      { productId, source, resourceText },
      {
        onSuccess: draft => setDraftByProduct(prev => ({ ...prev, [productId]: draft })),
        onError: () => void messageApi.error(fa.productEnrichment.generateError),
      },
    )
  }

  function clearDraft(productId: string) {
    setDraftByProduct(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const columns: ColumnsType<LowCompletenessProduct> = [
    { title: fa.productEnrichment.columnProduct, dataIndex: 'name', key: 'name' },
    { title: fa.productEnrichment.columnStore, dataIndex: 'storeName', key: 'storeName', width: 160 },
    {
      title: fa.productEnrichment.columnCompleteness,
      key: 'completeness',
      width: 240,
      render: (_, row) => `${row.completeness.percent}٪ — ${row.completeness.missing.join('، ')}`,
    },
    {
      title: fa.productEnrichment.columnDraftStatus,
      key: 'draftStatus',
      width: 160,
      render: (_, row) =>
        row.activeDraftStatus ? (
          <Tag color={STATUS_COLORS[row.activeDraftStatus]}>
            {fa.productEnrichment.draftStatusLabels[row.activeDraftStatus] ?? row.activeDraftStatus}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: fa.productEnrichment.columnActions,
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setActiveProductId(row.id)}>
          {fa.productEnrichment.review}
        </Button>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 4 }}>
        {fa.productEnrichment.title}
      </Title>
      <p style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>{fa.productEnrichment.subtitle}</p>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            showSearch
            placeholder={fa.productEnrichment.filterStore}
            style={{ width: 220 }}
            value={storeFilter}
            onChange={v => {
              setStoreFilter(v)
              setPage(1)
            }}
            options={(stores ?? []).map(s => ({ value: s.id, label: s.name }))}
            optionFilterProp="label"
          />
        </Space>

        <Table<LowCompletenessProduct>
          rowKey="id"
          dataSource={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: data?.limit ?? 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <Drawer
        open={!!activeRow}
        onClose={() => setActiveProductId(null)}
        placement="left"
        width={520}
        title={activeRow?.name ?? ''}
      >
        {activeRow && (() => {
          const row = activeRow
          const photoOnly = row.completeness.missing.length === 1 && row.completeness.missing[0] === 'عکس'
          if (photoOnly) {
            return <Text type="secondary">{fa.productEnrichment.missingPhotoOnly}</Text>
          }

          const draft = draftByProduct[row.id]
          if (draft) {
            return (
              <div>
                <Text strong>{fa.productEnrichment.reviewTitle}</Text>
                <p style={{ marginTop: 8 }}>
                  <Text type="secondary">{fa.productEnrichment.reviewDescription}: </Text>
                  {draft.suggestedDescription}
                </p>
                {!!draft.suggestedSpecs?.length && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">{fa.productEnrichment.reviewSpecs}: </Text>
                    {draft.suggestedSpecs.map((s, i) => (
                      <Tag key={i}>
                        {s.label}: {s.value}
                      </Tag>
                    ))}
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">{fa.productEnrichment.reviewQuestions}: </Text>
                  <ul style={{ marginTop: 4, marginBottom: 0 }}>
                    {draft.suggestedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
                {draft.sourceNote && (
                  <p>
                    <Text type="secondary">{fa.productEnrichment.reviewSourceNote}: </Text>
                    {draft.sourceNote}
                  </p>
                )}
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={approve.isPending}
                    onClick={() =>
                      approve.mutate(draft.id, { onSuccess: () => clearDraft(row.id) })
                    }
                  >
                    {fa.productEnrichment.approve}
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={reject.isPending}
                    onClick={() =>
                      reject.mutate(draft.id, { onSuccess: () => clearDraft(row.id) })
                    }
                  >
                    {fa.productEnrichment.reject}
                  </Button>
                </Space>
              </div>
            )
          }

          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                icon={<SearchOutlined />}
                loading={createDraft.isPending}
                onClick={() => generate(row.id, 'WEB_SEARCH')}
              >
                {fa.productEnrichment.generateWebSearch}
              </Button>
              <TextArea
                rows={3}
                placeholder={fa.productEnrichment.resourcePlaceholder}
                value={resourceTextByProduct[row.id] ?? ''}
                onChange={e =>
                  setResourceTextByProduct(prev => ({ ...prev, [row.id]: e.target.value }))
                }
              />
              <Button
                disabled={!resourceTextByProduct[row.id]?.trim()}
                loading={createDraft.isPending}
                onClick={() => generate(row.id, 'ADMIN_RESOURCE')}
              >
                {fa.productEnrichment.generateFromResource}
              </Button>
            </Space>
          )
        })()}
      </Drawer>
    </div>
  )
}
