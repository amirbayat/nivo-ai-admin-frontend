import { useState } from 'react'
import { Alert, Button, Card, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQaStores, useRunGoldenSet } from '@/queries/sales-agent-qa.queries'
import type { GoldenQuestionResult } from '@/types/api'
import { fa } from '@/locales/fa'

const { Title, Paragraph, Text } = Typography

// src/modules/sales-agent/model-variants.ts (بک‌اند) — کلیدهای A/B، نه اسم خام مدل روی
// OpenRouter؛ لیست اینجا فقط برای دراپ‌داون است، تغییرش هیچ اثری روی منطق بک‌اند ندارد
const VARIANT_OPTIONS = [
  'gpt-5.4-mini',
  'gpt-6-luna',
  'gpt-6.1-sol',
  'gemini-3.8-flash',
  'claude-sonnet-5.5',
  'grok-4.7',
  'jev-router',
]

export function SalesAgentQaPage() {
  const [storeId, setStoreId] = useState<string | undefined>(undefined)
  const [variant, setVariant] = useState<string | undefined>(undefined)
  const { data: stores, isLoading: storesLoading } = useQaStores()
  const runGoldenSet = useRunGoldenSet()

  const columns: ColumnsType<GoldenQuestionResult> = [
    { title: fa.salesAgentQa.category, dataIndex: 'category', key: 'category', width: 120 },
    { title: fa.salesAgentQa.question, dataIndex: 'question', key: 'question', width: 220 },
    {
      title: fa.salesAgentQa.answer,
      dataIndex: 'answer',
      key: 'answer',
      render: (v: string | undefined, item) =>
        item.error ? (
          <Tag color="red">
            {fa.salesAgentQa.error}: {item.error}
          </Tag>
        ) : (
          v
        ),
    },
    {
      title: fa.salesAgentQa.latency,
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      width: 100,
      render: (v: number) => `${v}ms`,
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 4 }}>
        {fa.salesAgentQa.title}
      </Title>
      <Paragraph type="secondary">{fa.salesAgentQa.subtitle}</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 260 }}
            placeholder={fa.salesAgentQa.selectStore}
            loading={storesLoading}
            value={storeId}
            onChange={setStoreId}
            options={(stores ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.slug})` }))}
            showSearch
            optionFilterProp="label"
          />
          <Select
            style={{ width: 220 }}
            placeholder={fa.salesAgentQa.selectVariant}
            value={variant}
            onChange={setVariant}
            options={VARIANT_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <Button
            type="primary"
            disabled={!storeId || !variant}
            loading={runGoldenSet.isPending}
            onClick={() => storeId && variant && runGoldenSet.mutate({ storeId, variant })}
          >
            {runGoldenSet.isPending ? fa.salesAgentQa.running : fa.salesAgentQa.run}
          </Button>
        </Space>
      </Card>

      {runGoldenSet.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={<Text>{fa.salesAgentQa.error}</Text>}
        />
      )}

      <Table<GoldenQuestionResult>
        rowKey="id"
        dataSource={runGoldenSet.data ?? []}
        columns={columns}
        loading={runGoldenSet.isPending}
        locale={{ emptyText: fa.salesAgentQa.empty }}
        pagination={false}
      />
    </div>
  )
}
