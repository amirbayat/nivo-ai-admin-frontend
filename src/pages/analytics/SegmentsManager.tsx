import { useState } from 'react'
import { Modal, Table, Button, Form, Input, InputNumber, Switch, Space, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UserSegment } from '@/types/api'
import { useAnalyticsSegments, useCreateSegment, useUpdateSegment, useDeleteSegment } from '@/queries/analytics.queries'
import { fa } from '@/locales/fa'

interface SegmentFormValues {
  label: string
  minMessagesPerDay: number | null
  maxMessagesPerDay: number | null
  minTokensPerDay: number | null
  maxTokensPerDay: number | null
  color: string | null
  sortOrder: number
  isActive: boolean
}

export function SegmentsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserSegment | null>(null)
  const [form] = Form.useForm<SegmentFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: segments, isLoading } = useAnalyticsSegments()
  const createSegment = useCreateSegment()
  const updateSegment = useUpdateSegment()
  const deleteSegment = useDeleteSegment()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, sortOrder: segments?.length ?? 0 })
    setEditOpen(true)
  }

  function openEdit(segment: UserSegment) {
    setEditing(segment)
    form.setFieldsValue(segment)
    setEditOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const onSuccess = () => {
        void messageApi.success(fa.common.success)
        setEditOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)
      if (editing) updateSegment.mutate({ id: editing.id, data: values }, { onSuccess, onError })
      else createSegment.mutate(values as Omit<UserSegment, 'id'>, { onSuccess, onError })
    })
  }

  const columns: ColumnsType<UserSegment> = [
    { title: 'لیبل', dataIndex: 'label', key: 'label' },
    {
      title: 'بازه‌ی پیام روزانه',
      key: 'messages',
      render: (_, r) => `${r.minMessagesPerDay ?? '—'} تا ${r.maxMessagesPerDay ?? '∞'}`,
    },
    {
      title: 'بازه‌ی توکن روزانه',
      key: 'tokens',
      render: (_, r) => `${r.minTokensPerDay ?? '—'} تا ${r.maxTokensPerDay ?? '∞'}`,
    },
    { title: 'ترتیب', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>ویرایش</Button>
          <Popconfirm title="حذف این دسته؟" onConfirm={() => deleteSegment.mutate(r.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={fa.analytics.manageSegments} width={760}>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن دسته</Button>
      </div>
      <Table<UserSegment>
        rowKey="id"
        dataSource={segments ?? []}
        columns={columns}
        loading={isLoading}
        pagination={false}
        size="small"
      />

      <Modal
        open={editOpen}
        title={editing ? 'ویرایش دسته' : 'دسته‌ی جدید'}
        onOk={handleSave}
        onCancel={() => setEditOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={createSegment.isPending || updateSegment.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="label" label="لیبل" rules={[{ required: true }]}>
            <Input placeholder="کم‌مصرف" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="minMessagesPerDay" label="حداقل پیام/روز">
              <InputNumber style={{ width: 160 }} min={0} placeholder="بدون حد" />
            </Form.Item>
            <Form.Item name="maxMessagesPerDay" label="حداکثر پیام/روز">
              <InputNumber style={{ width: 160 }} min={0} placeholder="بدون حد" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="minTokensPerDay" label="حداقل توکن/روز">
              <InputNumber style={{ width: 160 }} min={0} placeholder="بدون حد" />
            </Form.Item>
            <Form.Item name="maxTokensPerDay" label="حداکثر توکن/روز">
              <InputNumber style={{ width: 160 }} min={0} placeholder="بدون حد" />
            </Form.Item>
          </Space>
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
