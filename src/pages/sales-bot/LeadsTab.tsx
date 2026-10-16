import { useState } from 'react'
import { Button, Card, Col, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useLeadFunnelSummary, useSalesBotLeads, useSendLeadSms, useUpdateLeadFollowUp,
} from '@/queries/sales-bot.queries'
import type { LeadFollowUpStatus, LeadProfile, LeadSignupStatus } from '@/types/api'

const { Text } = Typography

const STATUS_OPTIONS: { value: LeadFollowUpStatus; label: string; color: string }[] = [
  { value: 'NEW', label: 'جدید', color: 'blue' },
  { value: 'CONTACTED', label: 'تماس گرفته‌شده', color: 'gold' },
  { value: 'CONVERTED', label: 'تبدیل‌شده', color: 'green' },
  { value: 'DECLINED', label: 'رد شده', color: 'red' },
]

const SIGNUP_TAGS: Record<LeadSignupStatus, { label: string; color: string }> = {
  PHONE_SUBMITTED: { label: 'تأیید نشده', color: 'orange' },
  VERIFIED: { label: 'ثبت‌نام شد', color: 'blue' },
  STORE_CREATED: { label: 'فروشگاه ساخت', color: 'green' },
}

const fa = (n: number) => n.toLocaleString('fa-IR')

export function LeadsTab() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [historyLead, setHistoryLead] = useState<LeadProfile | null>(null)
  const [smsLead, setSmsLead] = useState<LeadProfile | null>(null)
  const [smsText, setSmsText] = useState('')

  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined)
  const [signupFilter, setSignupFilter] = useState<string | undefined>(undefined)

  const { data, isLoading } = useSalesBotLeads(page, statusFilter, sourceFilter, signupFilter)
  const { data: summary } = useLeadFunnelSummary()
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
    {
      title: 'شماره',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string | null) =>
        v ? (
          <Text copyable={{ text: v }} style={{ direction: 'ltr' }}>
            {v}
          </Text>
        ) : (
          '—'
        ),
    },
    { title: 'نام', dataIndex: 'name', key: 'name', render: (v: string | null) => v ?? '—' },
    {
      title: 'نیاز',
      key: 'interest',
      render: (_, lead) => (Array.isArray(lead.interests) && lead.interests[0] ? String(lead.interests[0]) : (lead.jobTitle ?? '—')),
    },
    {
      title: 'وضعیت ثبت‌نام',
      key: 'signupStatus',
      render: (_, lead) =>
        lead.signupStatus ? <Tag color={SIGNUP_TAGS[lead.signupStatus].color}>{SIGNUP_TAGS[lead.signupStatus].label}</Tag> : '—',
    },
    {
      title: 'منبع',
      key: 'source',
      render: (_, lead) => (
        <span>
          {lead.storeName ?? lead.source}
          {lead.utmSource && (
            <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
              {[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ')}
            </Text>
          )}
        </span>
      ),
    },
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
      {summary && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card size="small"><Statistic title={`گفتگوها (${fa(summary.days)} روز اخیر)`} value={fa(summary.conversations)} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="شماره ثبت‌شده" value={fa(summary.phoneSubmitted)} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="تأیید شده" value={fa(summary.verified)} /></Card></Col>
          <Col xs={12} md={6}><Card size="small"><Statistic title="فروشگاه ساخته شده" value={fa(summary.storeCreated)} /></Card></Col>
        </Row>
      )}

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="فیلتر بر اساس وضعیت"
          style={{ width: 220 }}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
        <Select
          allowClear
          placeholder="منبع"
          style={{ width: 220 }}
          value={sourceFilter}
          onChange={(v) => { setSourceFilter(v); setPage(1) }}
          options={[
            { value: 'sales_agent_lead_capture', label: 'فقط لیدهای فروشگاه نیوو' },
            { value: 'pricing_page', label: 'صفحه‌ی قیمت (قدیمی)' },
          ]}
        />
        <Select
          allowClear
          placeholder="وضعیت ثبت‌نام"
          style={{ width: 200 }}
          value={signupFilter}
          onChange={(v) => { setSignupFilter(v); setPage(1) }}
          options={(Object.keys(SIGNUP_TAGS) as LeadSignupStatus[]).map((k) => ({ value: k, label: SIGNUP_TAGS[k].label }))}
        />
      </Space>

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
