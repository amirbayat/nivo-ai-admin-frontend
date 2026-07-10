import { useState } from 'react'
import { Alert, Button, Form, Input, Modal, Space, Table, Typography, message } from 'antd'
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCreateSalesKbEntry } from '@/queries/sales-bot.queries'
import { fetchSalesKbDraftExport, useSalesBotSessions } from '@/queries/sales-bot.queries'
import { downloadJson } from '@/lib/download-json'
import type { SalesChatSession, SalesKbEntryInput } from '@/types/api'

const { Text } = Typography
const { TextArea } = Input

interface AddToKbFormValues {
  label: string
  tags: string
  userMessage: string
  assistantReply: string
}

export function HistoryTab() {
  const [page, setPage] = useState(1)
  const [openSession, setOpenSession] = useState<SalesChatSession | null>(null)
  const [addFromTurn, setAddFromTurn] = useState<{ userMessage: string; assistantReply: string } | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [form] = Form.useForm<AddToKbFormValues>()

  const { data, isLoading } = useSalesBotSessions(page)
  const createEntry = useCreateSalesKbEntry()

  function firstUserMessage(session: SalesChatSession): string {
    return session.messages.find((m) => m.role === 'user')?.content ?? '—'
  }

  async function handleDownloadSession(sessionId: string) {
    const { entries } = await fetchSalesKbDraftExport(sessionId)
    downloadJson(`sales-chat-${sessionId.slice(0, 8)}.json`, { entries })
  }

  async function handleDownloadAll() {
    setDownloadingAll(true)
    try {
      const { entries } = await fetchSalesKbDraftExport()
      downloadJson(`sales-chats-all-${new Date().toISOString().slice(0, 10)}.json`, { entries })
    } finally {
      setDownloadingAll(false)
    }
  }

  function openAddToKb(userMessage: string, assistantReply: string) {
    setAddFromTurn({ userMessage, assistantReply })
    form.setFieldsValue({ label: `از تاریخچه — ${new Date().toLocaleDateString('fa-IR')}`, tags: 'from-history', userMessage, assistantReply })
  }

  function handleSubmitAddToKb() {
    form.validateFields().then((values) => {
      const payload: SalesKbEntryInput = {
        kind: 'EXAMPLE',
        label: values.label,
        tags: values.tags.split(',').map((t) => t.trim()).filter(Boolean),
        userMessage: values.userMessage,
        assistantReply: values.assistantReply,
      }
      createEntry.mutate(payload, {
        onSuccess: () => {
          void message.success('به پایگاه دانش اضافه شد')
          setAddFromTurn(null)
        },
        onError: () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      })
    })
  }

  const columns: ColumnsType<SalesChatSession> = [
    {
      title: 'سشن', dataIndex: 'sessionId', key: 'sessionId', width: 120,
      render: (v: string) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 8)}</Text>,
    },
    {
      title: 'اولین پیام کاربر', key: 'firstMessage',
      render: (_, session) => <Text ellipsis style={{ maxWidth: 320 }}>{firstUserMessage(session)}</Text>,
    },
    { title: 'تعداد پیام', dataIndex: 'messageCount', key: 'messageCount', width: 100 },
    {
      title: 'آخرین پیام', dataIndex: 'lastMessageAt', key: 'lastMessageAt', width: 160,
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: 'عملیات', key: 'actions', width: 180,
      render: (_, session) => (
        <Space>
          <Button size="small" onClick={() => setOpenSession(session)}>مشاهده</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadSession(session.sessionId)}>JSON</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="تاریخچه‌ی کامل مکالمات ربات فروش."
        description="روی هر مکالمه‌ی «مشاهده» بزن تا پیام‌های کاربر و ربات را ببینی و در صورت نیاز پاسخ را ویرایش‌شده به پایگاه دانش اضافه کنی."
      />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<DownloadOutlined />} loading={downloadingAll} onClick={handleDownloadAll}>
          دانلود JSON همه مشتریان
        </Button>
      </div>

      <Table<SalesChatSession>
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{ current: page, pageSize: data?.limit ?? 20, total: data?.total ?? 0, onChange: setPage }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={!!openSession}
        onCancel={() => setOpenSession(null)}
        footer={null}
        title={openSession ? `مکالمه — ${openSession.sessionId.slice(0, 8)}` : ''}
        width={720}
      >
        <Space direction="vertical" style={{ width: '100%', maxHeight: 500, overflowY: 'auto' }}>
          {openSession?.messages.map((m, i) => {
            const next = openSession.messages[i + 1]
            const isUserWithReply = m.role === 'user' && next?.role === 'assistant'
            return (
              <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{m.role === 'user' ? 'کاربر' : 'ربات'}</Text>
                <div>{m.content}</div>
                {isUserWithReply && (
                  <Button
                    size="small"
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => openAddToKb(m.content, next.content)}
                  >
                    افزودن این پاسخ به پایگاه دانش
                  </Button>
                )}
              </div>
            )
          })}
        </Space>
      </Modal>

      <Modal
        open={!!addFromTurn}
        onCancel={() => setAddFromTurn(null)}
        onOk={handleSubmitAddToKb}
        confirmLoading={createEntry.isPending}
        okText="ذخیره به‌عنوان نمونه"
        cancelText="انصراف"
        title="افزودن به پایگاه دانش"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="عنوان (فقط نمایشی)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="برچسب‌ها (با کاما جدا کن)">
            <Input placeholder="from-history" />
          </Form.Item>
          <Form.Item name="userMessage" label="پیام کاربر" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="assistantReply" label="پاسخ (قابل ویرایش قبل از ثبت)" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
