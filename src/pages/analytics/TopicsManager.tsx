import { useState } from 'react'
import { Modal, Table, Button, Form, Input, InputNumber, Switch, Space, Popconfirm, message, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Topic } from '@/types/api'
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '@/queries/analytics.queries'
import { fa } from '@/locales/fa'

interface TopicFormValues {
  name: string
  keywords: string
  color: string | null
  sortOrder: number
  isActive: boolean
}

export function TopicsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [form] = Form.useForm<TopicFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: topics, isLoading } = useTopics()
  const createTopic = useCreateTopic()
  const updateTopic = useUpdateTopic()
  const deleteTopic = useDeleteTopic()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, sortOrder: topics?.length ?? 0 })
    setEditOpen(true)
  }

  function openEdit(topic: Topic) {
    setEditing(topic)
    form.setFieldsValue({ ...topic, keywords: topic.keywords.join(', ') })
    setEditOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const data = { ...values, keywords: values.keywords.split(',').map((k) => k.trim()).filter(Boolean) }
      const onSuccess = () => {
        void messageApi.success(fa.common.success)
        setEditOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)
      if (editing) updateTopic.mutate({ id: editing.id, data }, { onSuccess, onError })
      else createTopic.mutate(data as Omit<Topic, 'id'>, { onSuccess, onError })
    })
  }

  const columns: ColumnsType<Topic> = [
    {
      title: 'نام',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r) => <Tag color={r.color ?? 'default'}>{v}</Tag>,
    },
    {
      title: 'کلیدواژه‌ها',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (v: string[]) => v.join('، '),
    },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>ویرایش</Button>
          <Popconfirm title="حذف این موضوع؟" onConfirm={() => deleteTopic.mutate(r.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={fa.analytics.manageTopics} width={760}>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن موضوع</Button>
      </div>
      <Table<Topic>
        rowKey="id"
        dataSource={topics ?? []}
        columns={columns}
        loading={isLoading}
        pagination={false}
        size="small"
      />

      <Modal
        open={editOpen}
        title={editing ? 'ویرایش موضوع' : 'موضوع جدید'}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={createTopic.isPending || updateTopic.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="نام" rules={[{ required: true }]}>
            <Input placeholder="برنامه‌نویسی" />
          </Form.Item>
          <Form.Item
            name="keywords"
            label="کلیدواژه‌ها (با کاما جدا کنید)"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} placeholder="کد, دیباگ, تابع, python" />
          </Form.Item>
          <Form.Item name="color" label="رنگ (اختیاری)">
            <Input placeholder="#4F46E5" />
          </Form.Item>
          <Form.Item name="sortOrder" label="ترتیب">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  )
}
