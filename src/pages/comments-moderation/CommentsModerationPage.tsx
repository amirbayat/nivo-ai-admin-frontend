import { useState } from 'react'
import { Card, Table, Button, Tag, Typography, Space, Select, message, Rate } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ProductCommentItem } from '@/types/api'
import { useComments, useModerateComment } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'gold',
  AI_AUTO_REJECTED: 'default',
  ADMIN_APPROVED: 'green',
  ADMIN_REJECTED: 'red',
}

// docs/PRD-customer-comments-and-discounts.md بخش ۵ — صف تعدیل مرکزی، تصمیم نهایی همیشه با ادمین
export function CommentsModerationPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>('PENDING')
  const [messageApi, contextHolder] = message.useMessage()

  const { data, isLoading } = useComments(page, statusFilter)
  const moderate = useModerateComment()

  function handleModerate(id: string, status: 'ADMIN_APPROVED' | 'ADMIN_REJECTED') {
    moderate.mutate(
      { id, status },
      { onError: () => void messageApi.error(fa.comments.moderateError) },
    )
  }

  const columns: ColumnsType<ProductCommentItem> = [
    {
      title: fa.comments.text,
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
    },
    {
      title: fa.comments.store,
      dataIndex: ['store', 'name'],
      key: 'store',
      width: 160,
    },
    {
      title: fa.comments.product,
      key: 'product',
      width: 160,
      render: (_, row) => row.product?.name ?? fa.comments.noProduct,
    },
    {
      title: fa.comments.rating,
      dataIndex: 'rating',
      key: 'rating',
      width: 130,
      render: (v: number | null) => (v ? <Rate disabled defaultValue={v} style={{ fontSize: 12 }} /> : '—'),
    },
    {
      title: fa.comments.aiVerdict,
      key: 'aiVerdict',
      width: 140,
      render: (_, row) =>
        row.aiConfidence == null ? (
          '—'
        ) : (
          <Tag color={row.aiConfidence >= 0.9 ? 'red' : row.aiConfidence >= 0.5 ? 'gold' : 'green'}>
            {fa.comments.aiConfident(row.aiConfidence)}
          </Tag>
        ),
    },
    {
      title: fa.comments.status,
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string) => <Tag color={STATUS_COLORS[v]}>{fa.comments.statusLabels[v] ?? v}</Tag>,
    },
    {
      title: fa.comments.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
    {
      title: '',
      key: 'actions',
      width: 150,
      render: (_, row) =>
        row.status === 'ADMIN_APPROVED' || row.status === 'ADMIN_REJECTED' ? null : (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              loading={moderate.isPending}
              onClick={() => handleModerate(row.id, 'ADMIN_APPROVED')}
            >
              {fa.comments.approve}
            </Button>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              loading={moderate.isPending}
              onClick={() => handleModerate(row.id, 'ADMIN_REJECTED')}
            >
              {fa.comments.reject}
            </Button>
          </Space>
        ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 4 }}>
        {fa.comments.title}
      </Title>
      <p style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>{fa.comments.subtitle}</p>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder={fa.comments.filterStatus}
            style={{ width: 220 }}
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1) }}
            options={[
              { value: 'PENDING', label: fa.comments.statusLabels.PENDING },
              { value: 'AI_AUTO_REJECTED', label: fa.comments.statusLabels.AI_AUTO_REJECTED },
              { value: 'ADMIN_APPROVED', label: fa.comments.statusLabels.ADMIN_APPROVED },
              { value: 'ADMIN_REJECTED', label: fa.comments.statusLabels.ADMIN_REJECTED },
            ]}
          />
        </Space>

        <Table<ProductCommentItem>
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
    </div>
  )
}
