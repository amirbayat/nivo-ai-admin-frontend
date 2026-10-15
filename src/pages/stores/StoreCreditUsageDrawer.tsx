import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { Button, DatePicker, Drawer, Input, Modal, Select, Space, Table, Tabs, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import DigitsInputNumber from '@/components/DigitsInputNumber'
import { useAdjustStoreCredit, useSetStoreStatus, useStoreAuditLog, useStoreCreditUsage } from '@/queries/store-credit.queries'
import type { AdminAuditLogItem, CreditUsageEventItem } from '@/types/api'
import { fa } from '@/locales/fa'

const { RangePicker } = DatePicker

const KIND_OPTIONS = Object.entries(fa.stores.kindLabels)
  .filter(([value]) => value !== 'TOPUP')
  .map(([value, label]) => ({ value, label }))

// docs/PRD-admin-seller-credit-overview.md بخش ۳ — جزئیات خام CreditUsageEvent یک فروشگاه،
// همان الگوی ConversationTraceDrawer (باز/بسته با prop، فچ فقط وقتی باز است)
export function StoreCreditUsageDrawer(props: {
  storeId: string | null
  storeName: string
  status?: 'ACTIVE' | 'SUSPENDED'
  onClose: () => void
}) {
  const { storeId, storeName, status, onClose } = props
  const [page, setPage] = useState(1)
  const [kind, setKind] = useState<string | undefined>(undefined)
  const [range, setRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [amount, setAmount] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const adjust = useAdjustStoreCredit()
  const setStatus = useSetStoreStatus()
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusReason, setStatusReason] = useState('')
  const suspended = status === 'SUSPENDED'
  const statusReasonOk = statusReason.trim().length >= 5 && statusReason.trim().length <= 200
  const audit = useStoreAuditLog(storeId)
  const t = fa.stores.usageDrawer
  const reasonOk = reason.trim().length >= 5 && reason.trim().length <= 200
  const amountOk = amount != null && Number.isInteger(amount) && amount !== 0 && Math.abs(amount) <= 50_000_000

  const submitAdjust = () => {
    if (!storeId || !amountOk || !reasonOk) return
    Modal.confirm({
      title: t.adjustConfirm(amount!),
      okText: t.adjustOk,
      cancelText: fa.common.cancel,
      onOk: async () => {
        try {
          const r = await adjust.mutateAsync({ storeId, amountToman: amount!, reason: reason.trim() })
          void message.success(t.adjustDone(r.afterToman))
          setAdjustOpen(false)
          setAmount(null)
          setReason('')
        } catch (err) {
          const msg = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message
          void message.error(typeof msg === 'string' ? msg : fa.common.error)
        }
      },
    })
  }

  const submitStatus = async () => {
    if (!storeId || !statusReasonOk) return
    try {
      await setStatus.mutateAsync({
        storeId,
        status: suspended ? 'ACTIVE' : 'SUSPENDED',
        reason: statusReason.trim(),
      })
      void message.success(fa.stores.usageDrawer.statusDone)
      setStatusOpen(false)
      setStatusReason('')
      onClose()
    } catch {
      void message.error(fa.common.error)
    }
  }

  const auditColumns: ColumnsType<AdminAuditLogItem> = [
    { title: t.date, dataIndex: 'createdAt', width: 150, render: (v: string) => new Date(v).toLocaleString('fa-IR') },
    { title: t.auditAction, dataIndex: 'action', width: 140, render: (v: string) => t.auditActionLabels[v] ?? v },
    {
      title: t.auditChange,
      width: 200,
      render: (_: unknown, row) => {
        const before = row.before as { creditBalanceToman?: number } | null
        const after = row.after as { creditBalanceToman?: number } | null
        if (before?.creditBalanceToman == null || after?.creditBalanceToman == null) return '—'
        return `${before.creditBalanceToman.toLocaleString('fa-IR')} ← ${after.creditBalanceToman.toLocaleString('fa-IR')}`
      },
    },
    { title: t.auditReason, dataIndex: 'reason', ellipsis: true },
  ]

  const { data, isLoading } = useStoreCreditUsage({
    storeId,
    page,
    kind,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
  })

  const columns: ColumnsType<CreditUsageEventItem> = [
    {
      title: fa.stores.usageDrawer.date,
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: fa.stores.usageDrawer.kind,
      dataIndex: 'kind',
      width: 130,
      render: (v: string) => fa.stores.kindLabels[v] ?? v,
    },
    {
      title: fa.stores.usageDrawer.model,
      dataIndex: 'model',
      ellipsis: true,
    },
    {
      title: fa.stores.usageDrawer.cost,
      dataIndex: 'costToman',
      width: 110,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    {
      title: fa.stores.usageDrawer.charged,
      dataIndex: 'chargedToman',
      width: 130,
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    {
      title: fa.stores.usageDrawer.quota,
      dataIndex: 'isFreeQuota',
      width: 90,
      render: (v: boolean) =>
        v ? (
          <Tag color="blue">{fa.stores.usageDrawer.freeQuota}</Tag>
        ) : (
          <Tag color="gold">{fa.stores.usageDrawer.paidQuota}</Tag>
        ),
    },
  ]

  return (
    <Drawer
      open={!!storeId}
      onClose={onClose}
      width={720}
      title={`${fa.stores.usageDrawer.titlePrefix} ${storeName}`}
    >
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => setAdjustOpen(true)}>{t.adjustButton}</Button>
        <Button danger={!suspended} onClick={() => setStatusOpen(true)}>
          {suspended ? t.activateButton : t.suspendButton}
        </Button>
      </Space>
      <Tabs
        items={[
          {
            key: 'usage',
            label: t.tabUsage,
            children: (
              <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={fa.stores.usageDrawer.filterKind}
          style={{ width: 180 }}
          value={kind}
          onChange={(v) => {
            setKind(v)
            setPage(1)
          }}
          options={KIND_OPTIONS}
        />
        <RangePicker
          value={range}
          onChange={(v) => {
            setRange(v && v[0] && v[1] ? [v[0], v[1]] : undefined)
            setPage(1)
          }}
        />
      </Space>

      <Table<CreditUsageEventItem>
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        locale={{ emptyText: fa.common.noData }}
        pagination={{
          current: page,
          pageSize: data?.pageSize ?? 30,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
              </>
            ),
          },
          {
            key: 'audit',
            label: t.tabAudit,
            children: (
              <Table<AdminAuditLogItem>
                rowKey="id"
                dataSource={audit.data ?? []}
                columns={auditColumns}
                loading={audit.isLoading}
                size="small"
                pagination={false}
                locale={{ emptyText: fa.common.noData }}
              />
            ),
          },
        ]}
      />
      <Modal
        open={statusOpen}
        title={suspended ? t.activateTitle : t.suspendTitle}
        onCancel={() => setStatusOpen(false)}
        onOk={() => void submitStatus()}
        okText={t.adjustOk}
        cancelText={fa.common.cancel}
        okButtonProps={{ disabled: !statusReasonOk, loading: setStatus.isPending, danger: !suspended }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {!suspended && <span>{t.suspendHint}</span>}
          <Input.TextArea
            rows={2}
            maxLength={200}
            placeholder={t.statusReason}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
          />
        </Space>
      </Modal>
      <Modal
        open={adjustOpen}
        title={t.adjustTitle}
        onCancel={() => setAdjustOpen(false)}
        onOk={submitAdjust}
        okText={t.adjustOk}
        cancelText={fa.common.cancel}
        okButtonProps={{ disabled: !amountOk || !reasonOk, loading: adjust.isPending }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <DigitsInputNumber
            style={{ width: '100%' }}
            placeholder={t.adjustAmount}
            value={amount}
            onChange={(v) => setAmount(typeof v === 'number' ? v : null)}
            precision={0}
            min={-50_000_000}
            max={50_000_000}
            formatter={(v) => (v == null ? '' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','))}
          />
          <Input.TextArea
            rows={2}
            maxLength={200}
            placeholder={t.adjustReason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Space>
      </Modal>
    </Drawer>
  )
}
