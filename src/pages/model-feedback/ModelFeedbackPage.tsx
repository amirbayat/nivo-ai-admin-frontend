import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Space,
  List,
  Select,
  Spin,
  message,
} from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ModelFeedbackItem } from '@/types/api'
import {
  useModelFeedback,
  useModelFeedbackSummary,
  useTriggerModelFeedbackSummary,
  useModels,
} from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title, Paragraph, Text } = Typography

export function ModelFeedbackPage() {
  const [page, setPage] = useState(1)
  const [modelFilter, setModelFilter] = useState<string | undefined>(undefined)
  const [voteFilter, setVoteFilter] = useState<string | undefined>(undefined)
  const [messageApi, contextHolder] = message.useMessage()

  const { data: models } = useModels()
  const { data: summaryData, isLoading: summaryLoading } = useModelFeedbackSummary()
  const { data: feedbackData, isLoading: feedbackLoading } = useModelFeedback(page, modelFilter, voteFilter)
  const triggerSummary = useTriggerModelFeedbackSummary()

  function handleTrigger() {
    triggerSummary.mutate(undefined, {
      onSuccess: () => void messageApi.success(fa.modelFeedback.summaryTriggered),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const columns: ColumnsType<ModelFeedbackItem> = [
    {
      title: fa.modelFeedback.message,
      dataIndex: ['message', 'content'],
      key: 'content',
      ellipsis: true,
    },
    {
      title: fa.modelFeedback.model,
      dataIndex: 'modelUsed',
      key: 'modelUsed',
      width: 170,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: fa.modelFeedback.vote,
      dataIndex: 'vote',
      key: 'vote',
      width: 100,
      render: (v: 'UP' | 'DOWN') => (
        <Tag color={v === 'UP' ? 'green' : 'red'}>{v === 'UP' ? fa.modelFeedback.up : fa.modelFeedback.down}</Tag>
      ),
    },
    {
      title: fa.modelFeedback.comment,
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: fa.modelFeedback.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.modelFeedback.title}
      </Title>

      <Card
        title={fa.modelFeedback.summary}
        style={{ marginBottom: 24 }}
        extra={
          <Button icon={<SyncOutlined />} onClick={handleTrigger} loading={triggerSummary.isPending}>
            {fa.modelFeedback.triggerSummary}
          </Button>
        }
      >
        {summaryLoading ? (
          <Spin />
        ) : summaryData ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>{summaryData.summary}</Paragraph>
            {summaryData.topIssues.length > 0 && (
              <div>
                <Text strong>{fa.modelFeedback.topIssues}</Text>
                <List
                  size="small"
                  style={{ marginTop: 8 }}
                  dataSource={summaryData.topIssues}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space>
                          <Tag style={{ fontFamily: 'monospace' }}>{item.model}</Tag>
                          <Text>{item.topic}</Text>
                          <Tag color="red">👎 {item.downCount}</Tag>
                          <Tag color="green">👍 {item.upCount}</Tag>
                        </Space>
                        {item.sampleComments?.length > 0 && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            «{item.sampleComments[0]}»
                          </Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Space>
        ) : (
          <Text type="secondary">{fa.modelFeedback.noSummary}</Text>
        )}
      </Card>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder={fa.modelFeedback.filterModel}
            style={{ width: 220 }}
            value={modelFilter}
            onChange={(v) => { setModelFilter(v); setPage(1) }}
            options={(models ?? []).map((m) => ({ value: m.name, label: m.displayName }))}
          />
          <Select
            allowClear
            placeholder={fa.modelFeedback.filterVote}
            style={{ width: 140 }}
            value={voteFilter}
            onChange={(v) => { setVoteFilter(v); setPage(1) }}
            options={[
              { value: 'UP', label: fa.modelFeedback.up },
              { value: 'DOWN', label: fa.modelFeedback.down },
            ]}
          />
        </Space>

        <Table<ModelFeedbackItem>
          rowKey="id"
          dataSource={feedbackData?.items ?? []}
          columns={columns}
          loading={feedbackLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={{
            current: page,
            pageSize: feedbackData?.limit ?? 20,
            total: feedbackData?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  )
}
