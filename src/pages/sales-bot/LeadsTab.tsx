import { useState } from 'react'
import { Button, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useSalesBotLeads, useSendLeadSms, useUpdateLeadFollowUp,
} from '@/queries/sales-bot.queries'
import type { LeadFollowUpStatus, LeadProfile } from '@/types/api'

const { Text } = Typography

const STATUS_OPTIONS: { value: LeadFollowUpStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'جدید', color: 'blue' },
  { value: 'CONTACTED', label: 'تماس گرفته‌شده', color: 'gold' },
  { value: 'CONVERTED', label: 'تبدیل‌شده', color: 'green' },
  { value: 'DECLINED', label: 'رد شده', color: 'red' },
]

export function LeadsTab() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [historyLead, setHistoryLead] = useState<LeadProfile | null>(null)
  const [smsLead, setSmsLead] = useState<LeadProfile | null>(null)
  const [smsText, setSmsText] = useState('')

  const { data, isLoading } = useSalesBotLeads(page, statusFilter)
  const updateStatus = useUpdateLeadFollowUp()
  const sendSms = useSendLeadSms()

  function handleSendSms() {
    if (!smsLead || !smsText.trim()) return
    sendSms.mutate({ id: smsLead.id, message: smsText.trim() }, {
      onSuccess: () => {
        void message.success('پیامک ارسال شد')
        setSmsLead(null)
        setSmsText('')
      },
      onError: () => void message.error('ارسال نشد، دوباره امتحان کن'),
    })
  }

  const columns: ColumnsType<LeadProfile> = [
    { title: 'شماره', dataIndex: 'phone', key: 'phone', render: (v: string | null) => v ?? '—' },
    { title: 'شغل', dataIndex: 'jobTitle', key: 'jobTitle', render: (v: string | null) => v ?? '—' },
    { title: 'منبع', dataIndex: 'source', key: 'source' },
    {
      title: 'وضعیت پیگیری',
      key: 'followUpStatus',
      render: (_, lead) => (
        <Select
          size="small"
          value={lead.followUpStatus}
          style={{ width: 160 }}
          onChange={(v) => updateStatus.mutate({ id: lead.id, followUpStatus: v })}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: <Tag color={s.color}>{s.label}</Tag> }))}
        />
      ),
    },
    { title: 'تاریخ', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleDateString('fa-IR') },
    {
      title: 'عملیات',
      key: 'actions',
      render: (_, lead) => (
        <Space>
          <Button size="small" onClick={() => setHistoryLead(lead)}>مکالمه</Button>
          <Button size="small" type="primary" disabled={!lead.phone} onClick={() => setSmsLead(lead)}>
            ارسال پیامک
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="فیلتر بر اساس وضعیت"
          style={{ width: 220 }}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </div>

      <Table<LeadProfile>
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize: data?.limit ?? 20,
          total: data?.total ?? 0,
          onChange: setPage,
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={!!historyLead}
        onCancel={() => setHistoryLead(null)}
        footer={null}
        title={historyLead ? `مکالمه — ${historyLead.phone ?? historyLead.sessionId ?? ''}` : ''}
        width={640}
      >
        <Space direction="vertical" style={{ width: '100%', maxHeight: 480, overflowY: 'auto' }}>
          {(historyLead?.chatHistory ?? []).map((m, i) => (
            <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{m.role === 'user' ? 'کاربر' : 'ربات'}</Text>
              <div>{m.content}</div>
            </div>
          ))}
        </Space>
      </Modal>

      <Modal
        open={!!smsLead}
        onCancel={() => setSmsLead(null)}
        onOk={handleSendSms}
        confirmLoading={sendSms.isPending}
        okText="ارسال"
        cancelText="انصراف"
        title={smsLead ? `ارسال پیامک به ${smsLead.phone}` : ''}
      >
        <Input.TextArea
          rows={4}
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="متن پیامک (مثلاً کد تخفیف یا لینک راهنما)"
        />
      </Modal>
    </div>
  )
}
