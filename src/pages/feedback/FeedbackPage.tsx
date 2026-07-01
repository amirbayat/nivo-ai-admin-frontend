import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  List,
  Spin,
  message,
} from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { FeedbackItem } from '@/types/api'
import { useFeedback, useFeedbackSummary, useTriggerSummary } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title, Paragraph, Text } = Typography

type CategoryKey = keyof typeof fa.feedback.categories

function categoryLabel(cat: string): string {
  const key = cat as CategoryKey
  return fa.feedback.categories[key] ?? cat
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    FEATURE_REQUEST: 'blue',
    BUG: 'red',
    UX: 'orange',
    PRICING: 'gold',
    GENERAL: 'default',
  }
  return map[cat] ?? 'default'
}

export function FeedbackPage() {
  const [page, setPage] = useState(1)
  const [messageApi, contextHolder] = message.useMessage()

  const { data: summaryData, isLoading: summaryLoading } = useFeedbackSummary()
  const { data: feedbackData, isLoading: feedbackLoading } = useFeedback(page)
  const triggerSummary = useTriggerSummary()

  function handleTrigger() {
    triggerSummary.mutate(undefined, {
      onSuccess: () => void messageApi.success(fa.feedback.summaryTriggered),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const columns: ColumnsType<FeedbackItem> = [
    {
      title: fa.feedback.content,
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: fa.feedback.category,
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => <Tag color={categoryColor(v)}>{categoryLabel(v)}</Tag>,
    },
    {
      title: fa.feedback.user,
      key: 'user',
      render: (_, record) => (
        <span dir="ltr">{record.user?.phone ?? '—'}</span>
      ),
    },
    {
      title: fa.feedback.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
    {
      title: fa.feedback.checked,
      dataIndex: 'isChecked',
      key: 'isChecked',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'orange'}>{v ? fa.feedback.checked : fa.feedback.unchecked}</Tag>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.feedback.title}
      </Title>

      <Card
        title={fa.feedback.summary}
        style={{ marginBottom: 24 }}
        extra={
          <Button
            icon={<SyncOutlined />}
            onClick={handleTrigger}
            loading={triggerSummary.isPending}
          >
            {fa.feedback.triggerSummary}
          </Button>
        }
      >
        {summaryLoading ? (
          <Spin />
        ) : summaryData ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>{summaryData.summary || fa.feedback.noSummary}</Paragraph>
            {summaryData.topItems.length > 0 && (
              <div>
                <Text strong>{fa.feedback.topItems}</Text>
                <List
                  size="small"
                  style={{ marginTop: 8 }}
                  dataSource={summaryData.topItems}
                  renderItem={(item) => (
                    <List.Item>
                      <Space>
                        <Tag color={categoryColor(item.category)}>{categoryLabel(item.category)}</Tag>
                        <Text>{item.title}</Text>
                        <Tag>{item.count}</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Space>
        ) : (
          <Text type="secondary">{fa.feedback.noSummary}</Text>
        )}
      </Card>

      <Card>
        <Table<FeedbackItem>
          rowKey="id"
          dataSource={feedbackData?.items ?? []}
          columns={columns}
          loading={feedbackLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: 10,
            total: feedbackData?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  )
}
