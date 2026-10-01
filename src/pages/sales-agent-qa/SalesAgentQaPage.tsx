import { useState } from 'react'
import { Alert, Button, Card, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useQaStores,
  useRunGoldenSet,
  useRunIntentGoldenSet,
  useRunImplicitNeedGoldenSet,
} from '@/queries/sales-agent-qa.queries'
import type { GoldenQuestionResult, IntentGoldenResult, ImplicitNeedGoldenResult } from '@/types/api'
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
  const [intentVariant, setIntentVariant] = useState<string | undefined>(undefined)
  const [implicitNeedVariant, setImplicitNeedVariant] = useState<string | undefined>(undefined)
  const { data: stores, isLoading: storesLoading } = useQaStores()
  const runGoldenSet = useRunGoldenSet()
  const runIntentGoldenSet = useRunIntentGoldenSet()
  const runImplicitNeedGoldenSet = useRunImplicitNeedGoldenSet()

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

  const intentColumns: ColumnsType<IntentGoldenResult> = [
    { title: fa.salesAgentQa.message, dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: fa.salesAgentQa.expected,
      key: 'expected',
      width: 220,
      render: (_: unknown, item: IntentGoldenResult) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.expectedIntent}</Text>
          {item.expectedBuyerNeeds && item.expectedBuyerNeeds.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.expectedBuyerNeeds.join('، ')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: fa.salesAgentQa.actual,
      key: 'actual',
      width: 220,
      render: (_: unknown, item: IntentGoldenResult) =>
        item.error ? (
          <Tag color="red">
            {fa.salesAgentQa.error}: {item.error}
          </Tag>
        ) : (
          <Space direction="vertical" size={0}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.actualIntent}</Text>
            {item.actualBuyerNeeds && item.actualBuyerNeeds.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.actualBuyerNeeds.join('، ')}
              </Text>
            )}
            {item.unmatchedBuyerNeed && (
              <Text type="warning" style={{ fontSize: 12 }}>
                ❓ {item.unmatchedBuyerNeed}
              </Text>
            )}
          </Space>
        ),
    },
    {
      title: fa.salesAgentQa.confidence,
      dataIndex: 'intentConfidence',
      key: 'intentConfidence',
      width: 90,
    },
    {
      title: fa.salesAgentQa.result,
      key: 'passed',
      width: 90,
      render: (_: unknown, item: IntentGoldenResult) =>
        item.error ? null : (
          <Tag color={item.passed ? 'green' : 'red'}>
            {item.passed ? fa.salesAgentQa.passed : fa.salesAgentQa.failed}
          </Tag>
        ),
    },
  ]

  const implicitNeedColumns: ColumnsType<ImplicitNeedGoldenResult> = [
    { title: fa.salesAgentQa.category, dataIndex: 'category', key: 'category', width: 150 },
    { title: fa.salesAgentQa.message, dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: fa.salesAgentQa.expected,
      key: 'expected',
      width: 220,
      render: (_: unknown, item: ImplicitNeedGoldenResult) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.expectedIntent}</Text>
          {item.expectedBuyerNeeds && item.expectedBuyerNeeds.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.expectedBuyerNeeds.join('، ')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: fa.salesAgentQa.actual,
      key: 'actual',
      width: 220,
      render: (_: unknown, item: ImplicitNeedGoldenResult) =>
        item.error ? (
          <Tag color="red">
            {fa.salesAgentQa.error}: {item.error}
          </Tag>
        ) : (
          <Space direction="vertical" size={0}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.actualIntent}</Text>
            {item.actualBuyerNeeds && item.actualBuyerNeeds.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.actualBuyerNeeds.join('، ')}
              </Text>
            )}
            {item.unmatchedBuyerNeed && (
              <Text type="warning" style={{ fontSize: 12 }}>
                ❓ {item.unmatchedBuyerNeed}
              </Text>
            )}
          </Space>
        ),
    },
    {
      title: fa.salesAgentQa.signals,
      key: 'signals',
      width: 260,
      render: (_: unknown, item: ImplicitNeedGoldenResult) =>
        item.error ? null : (
          <Space direction="vertical" size={0} style={{ fontSize: 11 }}>
            <Text style={{ fontSize: 11 }}>
              needType: <Text code>{item.actualNeedType ?? '—'}</Text>
              {item.expectedNeedType && item.expectedNeedType !== item.actualNeedType && (
                <Text type="danger"> (انتظار: {item.expectedNeedType})</Text>
              )}
            </Text>
            <Text style={{ fontSize: 11 }}>
              storeRelevance: <Text code>{item.actualStoreRelevance ?? '—'}</Text>
              {item.expectedStoreRelevance && item.expectedStoreRelevance !== item.actualStoreRelevance && (
                <Text type="danger"> (انتظار: {item.expectedStoreRelevance})</Text>
              )}
            </Text>
            <Text style={{ fontSize: 11 }}>
              pitchReadiness: <Text code>{item.actualPitchReadiness ?? '—'}</Text>
              {item.expectedPitchReadiness && item.expectedPitchReadiness !== item.actualPitchReadiness && (
                <Text type="danger"> (انتظار: {item.expectedPitchReadiness})</Text>
              )}
            </Text>
            {item.implicitNeedSummary && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                «{item.implicitNeedSummary}»
              </Text>
            )}
          </Space>
        ),
    },
    {
      title: fa.salesAgentQa.result,
      key: 'passed',
      width: 150,
      render: (_: unknown, item: ImplicitNeedGoldenResult) =>
        item.error ? null : (
          <Space direction="vertical" size={0}>
            <Tag color={item.passed ? 'green' : 'red'}>
              {item.passed ? fa.salesAgentQa.passed : fa.salesAgentQa.failed}
            </Tag>
            {item.notFullyMeasurableYet && (
              <Text type="warning" style={{ fontSize: 11 }}>
                {fa.salesAgentQa.notMeasurableYet}
              </Text>
            )}
          </Space>
        ),
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

      <Title level={4} style={{ margin: '32px 0 4px' }}>
        {fa.salesAgentQa.intentTitle}
      </Title>
      <Paragraph type="secondary">{fa.salesAgentQa.intentSubtitle}</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 220 }}
            placeholder={fa.salesAgentQa.selectVariant}
            value={intentVariant}
            onChange={setIntentVariant}
            options={VARIANT_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <Button
            type="primary"
            disabled={!intentVariant}
            loading={runIntentGoldenSet.isPending}
            onClick={() => intentVariant && runIntentGoldenSet.mutate({ variant: intentVariant })}
          >
            {runIntentGoldenSet.isPending ? fa.salesAgentQa.running : fa.salesAgentQa.runIntent}
          </Button>
          {runIntentGoldenSet.data && (
            <Text type="secondary">
              {runIntentGoldenSet.data.filter((r) => r.passed).length} / {runIntentGoldenSet.data.length}{' '}
              {fa.salesAgentQa.passed}
            </Text>
          )}
        </Space>
      </Card>

      {runIntentGoldenSet.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={<Text>{fa.salesAgentQa.error}</Text>}
        />
      )}

      <Table<IntentGoldenResult>
        rowKey="id"
        dataSource={runIntentGoldenSet.data ?? []}
        columns={intentColumns}
        loading={runIntentGoldenSet.isPending}
        locale={{ emptyText: fa.salesAgentQa.intentEmpty }}
        pagination={false}
      />

      <Title level={4} style={{ margin: '32px 0 4px' }}>
        {fa.salesAgentQa.implicitNeedTitle}
      </Title>
      <Paragraph type="secondary">{fa.salesAgentQa.implicitNeedSubtitle}</Paragraph>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 220 }}
            placeholder={fa.salesAgentQa.selectVariant}
            value={implicitNeedVariant}
            onChange={setImplicitNeedVariant}
            options={VARIANT_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <Button
            type="primary"
            disabled={!implicitNeedVariant}
            loading={runImplicitNeedGoldenSet.isPending}
            onClick={() =>
              implicitNeedVariant && runImplicitNeedGoldenSet.mutate({ variant: implicitNeedVariant })
            }
          >
            {runImplicitNeedGoldenSet.isPending ? fa.salesAgentQa.running : fa.salesAgentQa.runImplicitNeed}
          </Button>
          {runImplicitNeedGoldenSet.data && (
            <Text type="secondary">
              {runImplicitNeedGoldenSet.data.filter((r) => r.passed).length} /{' '}
              {runImplicitNeedGoldenSet.data.length} {fa.salesAgentQa.passed}
            </Text>
          )}
        </Space>
      </Card>

      {runImplicitNeedGoldenSet.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={<Text>{fa.salesAgentQa.error}</Text>}
        />
      )}

      <Table<ImplicitNeedGoldenResult>
        rowKey="id"
        dataSource={runImplicitNeedGoldenSet.data ?? []}
        columns={implicitNeedColumns}
        loading={runImplicitNeedGoldenSet.isPending}
        locale={{ emptyText: fa.salesAgentQa.implicitNeedEmpty }}
        pagination={false}
      />
    </div>
  )
}
