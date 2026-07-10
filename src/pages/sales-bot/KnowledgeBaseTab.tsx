import { useState } from 'react'
import {
  Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, Upload, message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  useBulkImportSalesKb, useCreateSalesKbEntry, useDeleteSalesKbEntry, useSalesKbEntries,
  useTestSalesKbRetrieval, useUpdateSalesKbEntry,
} from '@/queries/sales-bot.queries'
import type { SalesKbEntry, SalesKbEntryInput, SalesKbKind } from '@/types/api'

const { Text } = Typography
const { TextArea } = Input

const KIND_OPTIONS: { value: SalesKbKind; label: string; color: string }[] = [
  { value: 'EXAMPLE', label: 'نمونه مکالمه', color: 'blue' },
  { value: 'OBJECTION', label: 'اعتراض', color: 'red' },
  { value: 'FAQ', label: 'سوال متداول', color: 'gold' },
  { value: 'PERSONA_GUIDANCE', label: 'راهنمای پرسونا', color: 'purple' },
]

function kindLabel(kind: SalesKbKind) {
  return KIND_OPTIONS.find((k) => k.value === kind) ?? KIND_OPTIONS[0]
}

interface EntryFormValues {
  kind: SalesKbKind
  label: string
  tags: string
  userMessage: string
  assistantReply: string
  note?: string
  isActive: boolean
}

export function KnowledgeBaseTab() {
  const [kindFilter, setKindFilter] = useState<string | undefined>(undefined)
  const [editing, setEditing] = useState<SalesKbEntry | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [form] = Form.useForm<EntryFormValues>()

  const { data: entries, isLoading } = useSalesKbEntries(kindFilter)
  const createEntry = useCreateSalesKbEntry()
  const updateEntry = useUpdateSalesKbEntry()
  const deleteEntry = useDeleteSalesKbEntry()
  const bulkImport = useBulkImportSalesKb()
  const testRetrieval = useTestSalesKbRetrieval()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ kind: 'EXAMPLE', isActive: true, tags: '' })
    setFormOpen(true)
  }

  function openEdit(entry: SalesKbEntry) {
    setEditing(entry)
    form.setFieldsValue({
      kind: entry.kind,
      label: entry.label,
      tags: entry.tags.join(', '),
      userMessage: entry.userMessage,
      assistantReply: entry.assistantReply,
      note: entry.note ?? '',
      isActive: entry.isActive,
    })
    setFormOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const payload: SalesKbEntryInput = {
        kind: values.kind,
        label: values.label,
        tags: values.tags.split(',').map((t) => t.trim()).filter(Boolean),
        userMessage: values.userMessage,
        assistantReply: values.assistantReply,
        note: values.note,
        isActive: values.isActive,
      }
      const mutation = editing
        ? updateEntry.mutateAsync({ id: editing.id, data: payload })
        : createEntry.mutateAsync(payload)

      mutation.then(
        () => {
          void message.success('ذخیره شد — embedding به‌صورت خودکار محاسبه می‌شود')
          setFormOpen(false)
        },
        () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      )
    })
  }

  function handleUpload(file: File): boolean {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result))
        const list: SalesKbEntryInput[] = Array.isArray(raw) ? raw : raw.entries
        if (!Array.isArray(list)) throw new Error('فرمت فایل درست نیست')

        bulkImport.mutate(list, {
          onSuccess: (result) => {
            void message.success(`${result.created} نمونه اضافه شد${result.failed ? `، ${result.failed} مورد ناموفق` : ''}`)
            if (result.errors.length > 0) {
              Modal.warning({
                title: 'خطاهای آپلود',
                width: 600,
                content: (
                  <ul style={{ maxHeight: 300, overflow: 'auto', paddingRight: 16 }}>
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                ),
              })
            }
          },
          onError: () => void message.error('آپلود ناموفق بود'),
        })
      } catch {
        void message.error('فایل JSON معتبر نیست — باید آرایه‌ای از نمونه‌ها یا { "entries": [...] } باشد')
      }
    }
    reader.readAsText(file)
    return false
  }

  function handleTestRetrieval() {
    if (!testMessage.trim()) return
    testRetrieval.mutate(testMessage.trim())
  }

  const columns: ColumnsType<SalesKbEntry> = [
    {
      title: 'نوع', dataIndex: 'kind', key: 'kind', width: 140,
      render: (v: SalesKbKind) => <Tag color={kindLabel(v).color}>{kindLabel(v).label}</Tag>,
    },
    { title: 'عنوان', dataIndex: 'label', key: 'label' },
    {
      title: 'پیام نمونه', dataIndex: 'userMessage', key: 'userMessage',
      render: (v: string) => <Text style={{ maxWidth: 260 }} ellipsis={{ tooltip: v }}>{v}</Text>,
    },
    {
      title: 'برچسب‌ها', dataIndex: 'tags', key: 'tags',
      render: (tags: string[]) => tags.map((t) => <Tag key={t}>{t}</Tag>),
    },
    {
      title: 'وضعیت embedding', dataIndex: 'embeddingModel', key: 'embeddingModel',
      render: (v: string | null) => v ? <Tag color="green">محاسبه‌شده</Tag> : <Tag color="orange">در انتظار</Tag>,
    },
    {
      title: 'فعال', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean) => v ? <Tag color="green">فعال</Tag> : <Tag>غیرفعال</Tag>,
    },
    {
      title: 'عملیات', key: 'actions',
      render: (_, entry) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(entry)} />
          <Popconfirm title="این نمونه حذف شود؟" onConfirm={() => deleteEntry.mutate(entry.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
        message="هر نمونه یک بردار embedding دارد که هنگام ذخیره خودکار محاسبه می‌شود."
        description="وقتی پیام یک کاربر واقعی به این نمونه‌ها شبیه باشد، پاسخ نمونه به‌عنوان راهنما به مدل ضمیمه می‌شود. جزئیات: docs/PRD-sales-kb-rag-and-plan-context.md بخش الف."
      />

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Select
          allowClear
          placeholder="فیلتر بر اساس نوع"
          style={{ width: 220 }}
          value={kindFilter}
          onChange={setKindFilter}
          options={KIND_OPTIONS.map((k) => ({ value: k.value, label: k.label }))}
        />
        <Space>
          <Button onClick={() => setTestOpen(true)}>تست بازیابی</Button>
          <Upload accept=".json" showUploadList={false} beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />} loading={bulkImport.isPending}>آپلود دسته‌ای (JSON)</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن نمونه</Button>
        </Space>
      </div>

      <Table<SalesKbEntry>
        rowKey="id"
        dataSource={entries ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSave}
        confirmLoading={createEntry.isPending || updateEntry.isPending}
        okText="ذخیره"
        cancelText="انصراف"
        title={editing ? 'ویرایش نمونه' : 'افزودن نمونه'}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="kind" label="نوع" rules={[{ required: true }]}>
            <Select options={KIND_OPTIONS.map((k) => ({ value: k.value, label: k.label }))} />
          </Form.Item>
          <Form.Item name="label" label="عنوان (فقط نمایشی)" rules={[{ required: true }]}>
            <Input placeholder="مثلاً: اعتراض قیمت — گرونه" />
          </Form.Item>
          <Form.Item name="tags" label="برچسب‌ها (با کاما جدا کن)">
            <Input placeholder="price, objection" />
          </Form.Item>
          <Form.Item name="userMessage" label="پیام نمونه‌ی کاربر" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="assistantReply" label="پاسخ نمونه" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="note" label="توضیح داخلی (اختیاری — به مدل فرستاده نمی‌شود)">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={testOpen}
        onCancel={() => setTestOpen(false)}
        footer={null}
        title="تست بازیابی"
        width={640}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="یک پیام نمونه‌ی کاربر بنویس..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onPressEnter={handleTestRetrieval}
          />
          <Button type="primary" loading={testRetrieval.isPending} onClick={handleTestRetrieval}>بررسی</Button>
        </Space.Compact>
        {testRetrieval.data && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {testRetrieval.data.map((r) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <Text ellipsis style={{ maxWidth: 420 }}>{r.userMessage}</Text>
                <Tag color={r.score >= 0.75 ? 'green' : 'default'}>{r.score.toFixed(3)}</Tag>
              </div>
            ))}
          </Space>
        )}
      </Modal>
    </div>
  )
}
