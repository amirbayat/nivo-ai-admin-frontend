import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Drawer,
  Space,
  Select,
  Input,
  Tabs,
  message,
  Divider,
} from 'antd'
import { CustomerServiceOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  useAdminTickets,
  useAdminTicketDetail,
  useAdminReplyTicket,
  useUpdateTicketStatus,
} from '@/queries/admin.queries'
import type { AdminTicket } from '@/types/api'
import { fa } from '@/locales/fa'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

type Status = AdminTicket['status']
type Priority = AdminTicket['priority']

const STATUS_OPTIONS: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const STATUS_COLOR: Record<Status, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'orange',
  RESOLVED: 'green',
  CLOSED: 'default',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: 'default',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
}

type TabKey = 'all' | Status

const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'OPEN', label: fa.ticket.status.OPEN },
  { key: 'IN_PROGRESS', label: fa.ticket.status.IN_PROGRESS },
  { key: 'RESOLVED', label: fa.ticket.status.RESOLVED },
  { key: 'CLOSED', label: fa.ticket.status.CLOSED },
]

function TicketDrawer({
  ticketId,
  onClose,
}: {
  ticketId: string
  onClose: () => void
}) {
  const { data: ticket, isLoading } = useAdminTicketDetail(ticketId)
  const replyMutation = useAdminReplyTicket()
  const updateStatus = useUpdateTicketStatus()
  const [messageApi, contextHolder] = message.useMessage()

  const [replyBody, setReplyBody] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [newStatus, setNewStatus] = useState<Status | undefined>()
  const [newPriority, setNewPriority] = useState<Priority | undefined>()
  const [noteInput, setNoteInput] = useState('')

  function handleReply() {
    if (!replyBody.trim()) return
    replyMutation.mutate(
      { id: ticketId, body: replyBody.trim(), adminNote: adminNote.trim() || undefined },
      {
        onSuccess: () => {
          setReplyBody('')
          setAdminNote('')
          void messageApi.success(fa.common.success)
        },
        onError: () => void messageApi.error(fa.common.error),
      },
    )
  }

  function handleUpdateStatus() {
    updateStatus.mutate(
      {
        id: ticketId,
        status: newStatus,
        priority: newPriority,
        adminNote: noteInput.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNoteInput('')
          void messageApi.success(fa.common.success)
        },
        onError: () => void messageApi.error(fa.common.error),
      },
    )
  }

  return (
    <Drawer
      open
      onClose={onClose}
      width={520}
      title={ticket ? ticket.subject : fa.common.loading}
      placement="left"
    >
      {contextHolder}
      {isLoading ? (
        <div>{fa.common.loading}</div>
      ) : !ticket ? (
        <div>{fa.common.error}</div>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* ticket info */}
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">کاربر:</Text>
                <Text dir="ltr">{ticket.user.phone}</Text>
              </div>
              {ticket.user.name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">نام:</Text>
                  <Text>{ticket.user.name}</Text>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">وضعیت:</Text>
                <Tag color={STATUS_COLOR[ticket.status]}>{fa.ticket.status[ticket.status]}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">اولویت:</Text>
                <Tag color={PRIORITY_COLOR[ticket.priority]}>{fa.ticket.priority[ticket.priority]}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">تاریخ:</Text>
                <Text>{new Date(ticket.createdAt).toLocaleDateString('fa-IR')}</Text>
              </div>
            </Space>
          </Card>

          {/* admin note */}
          {ticket.adminNote && (
            <Card
              size="small"
              style={{ background: '#fffbe6', borderColor: '#ffe58f' }}
              title={<Text style={{ color: '#d48806' }}>{fa.ticket.adminNote}</Text>}
            >
              <Paragraph style={{ margin: 0 }}>{ticket.adminNote}</Paragraph>
            </Card>
          )}

          {/* conversation */}
          <div>
            <Text strong>گفتگو</Text>
            <div
              style={{
                marginTop: 8,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {/* original message */}
              <div style={{ padding: '12px 16px', background: '#f6ffed', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>پیام اولیه</Text>
                <Paragraph style={{ margin: '4px 0 0' }}>{ticket.body}</Paragraph>
              </div>
              {/* replies */}
              {ticket.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    padding: '12px 16px',
                    background: reply.fromAdmin ? '#f0f5ff' : '#f6ffed',
                    borderBottom: '1px solid #f0f0f0',
                    textAlign: reply.fromAdmin ? 'left' : 'right',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {reply.fromAdmin ? 'پاسخ پشتیبانی' : 'پیام کاربر'}
                    {' · '}
                    {new Date(reply.createdAt).toLocaleDateString('fa-IR')}
                  </Text>
                  <Paragraph style={{ margin: '4px 0 0' }}>{reply.body}</Paragraph>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ margin: '0' }} />

          {/* reply form */}
          <div>
            <Text strong>{fa.ticket.reply}</Text>
            <TextArea
              rows={3}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={fa.ticket.reply}
              style={{ marginTop: 8 }}
            />
            <TextArea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={fa.ticket.adminNote + ' (اختیاری)'}
              style={{ marginTop: 8 }}
            />
            <Button
              type="primary"
              onClick={handleReply}
              loading={replyMutation.isPending}
              style={{ marginTop: 8 }}
              disabled={!replyBody.trim()}
            >
              {fa.ticket.sendReply}
            </Button>
          </div>

          <Divider style={{ margin: '0' }} />

          {/* status/priority update */}
          <div>
            <Text strong>{fa.ticket.changeStatus}</Text>
            <Space wrap style={{ marginTop: 8, width: '100%' }}>
              <Select
                placeholder="وضعیت"
                style={{ width: 160 }}
                value={newStatus}
                onChange={setNewStatus}
                options={STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: fa.ticket.status[s],
                }))}
              />
              <Select
                placeholder="اولویت"
                style={{ width: 160 }}
                value={newPriority}
                onChange={setNewPriority}
                options={PRIORITY_OPTIONS.map((p) => ({
                  value: p,
                  label: fa.ticket.priority[p],
                }))}
              />
            </Space>
            <TextArea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={fa.ticket.adminNote + ' (اختیاری)'}
              style={{ marginTop: 8 }}
            />
            <Button
              onClick={handleUpdateStatus}
              loading={updateStatus.isPending}
              style={{ marginTop: 8 }}
              disabled={!newStatus && !newPriority}
            >
              {fa.ticket.changeStatus}
            </Button>
          </div>
        </Space>
      )}
    </Drawer>
  )
}

export function TicketsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: tickets, isLoading } = useAdminTickets(
    activeTab === 'all' ? undefined : activeTab,
  )

  const columns: ColumnsType<AdminTicket> = [
    {
      title: 'کاربر',
      key: 'user',
      render: (_, record) => <span dir="ltr">{record.user.phone}</span>,
    },
    {
      title: 'موضوع',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      key: 'status',
      render: (v: Status) => (
        <Tag color={STATUS_COLOR[v]}>{fa.ticket.status[v]}</Tag>
      ),
    },
    {
      title: 'اولویت',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: Priority) => (
        <Tag color={PRIORITY_COLOR[v]}>{fa.ticket.priority[v]}</Tag>
      ),
    },
    {
      title: 'تاریخ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, record) => (
        <Button size="small" onClick={() => setSelectedId(record.id)}>
          مشاهده
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <CustomerServiceOutlined style={{ marginLeft: 8 }} />
        {fa.ticket.list}
      </Title>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
          items={TAB_ITEMS.map((t) => ({ key: t.key, label: t.label }))}
          style={{ marginBottom: 16 }}
        />
        <Table<AdminTicket>
          rowKey="id"
          dataSource={tickets ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.ticket.noTickets }}
          onRow={(record) => ({
            onClick: () => setSelectedId(record.id),
            style: { cursor: 'pointer' },
          })}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      {selectedId && (
        <TicketDrawer ticketId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
