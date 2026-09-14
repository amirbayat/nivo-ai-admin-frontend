import { useState } from 'react'
import {
  Alert, Button, Form, Input, Modal, Popconfirm, Table, Tag, Typography, message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ContentAgentApiKey } from '@/types/api'
import { useApiKeys, useCreateApiKey, useSetApiKeyActive } from '@/queries/content-agent.queries'

const { Text, Paragraph } = Typography

interface CreateFormValues {
  label: string
}

// docs/PRD-daily-content-prompt-agent.md بخش ۴ — کلید محلی که Claude Code روی سیستم کاربر
// با آن محتوای تاییدشده را به بک‌اند می‌فرستد. کلید خام فقط همین یک‌بار نمایش داده می‌شود.
export function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys()
  const createKey = useCreateApiKey()
  const setActive = useSetApiKeyActive()
  const [open, setOpen] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [form] = Form.useForm<CreateFormValues>()

  function openCreate() {
    form.resetFields()
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      createKey.mutate(
        { label: values.label },
        {
          onSuccess: (data) => {
            setOpen(false)
            setRevealedKey(data.rawKey)
          },
          onError: () => void message.error('ساخته نشد، دوباره امتحان کن'),
        },
      )
    })
  }

  const columns: ColumnsType<ContentAgentApiKey> = [
    { title: 'برچسب', dataIndex: 'label', key: 'label' },
    {
      title: 'وضعیت', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean) => (v ? <Tag color="green">فعال</Tag> : <Tag color="red">باطل‌شده</Tag>),
    },
    {
      title: 'آخرین استفاده', dataIndex: 'lastUsedAt', key: 'lastUsedAt',
      render: (v: string | null) => (v ? new Date(v).toLocaleString('fa-IR') : 'هنوز استفاده نشده'),
    },
    {
      title: 'ساخته‌شده', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
    {
      title: '', key: 'actions',
      render: (_, r) =>
        r.isActive ? (
          <Popconfirm
            title="این کلید باطل شود؟"
            description="هر اسکریپتی که از این کلید استفاده می‌کند دیگر کار نخواهد کرد."
            okText="باطل کن"
            cancelText="انصراف"
            onConfirm={() => setActive.mutate({ id: r.id, isActive: false })}
          >
            <Button danger size="small" loading={setActive.isPending}>باطل‌کردن</Button>
          </Popconfirm>
        ) : (
          <Button
            size="small"
            loading={setActive.isPending}
            onClick={() => setActive.mutate({ id: r.id, isActive: true })}
          >
            فعال‌کردن
          </Button>
        ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>کلیدهای ایجنت محتوا</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          ساخت کلید جدید
        </Button>
      </div>

      <Table<ContentAgentApiKey>
        rowKey="id"
        dataSource={keys ?? []}
        columns={columns}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        title="ساخت کلید جدید"
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText="ذخیره"
        cancelText="انصراف"
        confirmLoading={createKey.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="label" label="برچسب" rules={[{ required: true, message: 'برچسب را وارد کنید' }]}
            extra="مثلاً «لپ‌تاپ اصلی» — فقط برای تشخیص خودتان در جدول"
          >
            <Input placeholder="لپ‌تاپ اصلی" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={revealedKey !== null}
        title="کلید ساخته شد"
        onCancel={() => setRevealedKey(null)}
        onOk={() => setRevealedKey(null)}
        okText="متوجه شدم، بستن"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="این کلید فقط همین یک‌بار نمایش داده می‌شود"
          description="همین الان کپی و در جای امنی (مثلاً یک فایل env محلی) ذخیره کنید — بعد از بستن این پنجره دیگر قابل‌بازیابی نیست."
        />
        <Paragraph>
          <Text code copyable style={{ direction: 'ltr', display: 'inline-block' }}>
            {revealedKey}
          </Text>
        </Paragraph>
      </Modal>
    </div>
  )
}
