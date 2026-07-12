import { useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Typography, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  useArticleCategories, useCreateArticleCategory, useDeleteArticleCategory, useUpdateArticleCategory,
} from '@/queries/articles.queries'
import type { ArticleCategory, ArticleCategoryInput } from '@/types/api'

const { Title } = Typography

export function ArticleCategoriesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ArticleCategory | null>(null)
  const [form] = Form.useForm<ArticleCategoryInput>()

  const { data: categories, isLoading } = useArticleCategories()
  const createCategory = useCreateArticleCategory()
  const updateCategory = useUpdateArticleCategory()
  const deleteCategory = useDeleteArticleCategory()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ sortOrder: categories?.length ?? 0, isActive: true })
    setOpen(true)
  }

  function openEdit(category: ArticleCategory) {
    setEditing(category)
    form.setFieldsValue(category)
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const mutation = editing
        ? updateCategory.mutateAsync({ id: editing.id, data: values })
        : createCategory.mutateAsync(values)
      mutation.then(
        () => {
          void message.success('ذخیره شد')
          setOpen(false)
        },
        () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      )
    })
  }

  const columns: ColumnsType<ArticleCategory> = [
    { title: 'نام', dataIndex: 'name', key: 'name' },
    { title: 'slug', dataIndex: 'slug', key: 'slug', render: (v: string) => <code>{v}</code> },
    { title: 'ترتیب', dataIndex: 'sortOrder', key: 'sortOrder', width: 90 },
    {
      title: 'فعال', dataIndex: 'isActive', key: 'isActive', width: 90,
      render: (v: boolean) => (v ? '✅' : '—'),
    },
    {
      title: 'عملیات', key: 'actions', width: 140,
      render: (_, category) => (
        <Space>
          <Button size="small" onClick={() => openEdit(category)}>ویرایش</Button>
          <Popconfirm title="این دسته‌بندی حذف شود؟" onConfirm={() => deleteCategory.mutate(category.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>دسته‌بندی مقالات</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن دسته‌بندی</Button>
      </div>

      <Table<ArticleCategory>
        rowKey="id"
        dataSource={categories ?? []}
        columns={columns}
        loading={isLoading}
        pagination={false}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={createCategory.isPending || updateCategory.isPending}
        okText="ذخیره"
        cancelText="انصراف"
        title={editing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="نام" rules={[{ required: true }]}>
            <Input placeholder="مثلاً: آموزش" />
          </Form.Item>
          <Form.Item name="slug" label="slug (اختیاری — اگر خالی بماند خودکار ساخته می‌شود)">
            <Input placeholder="amoozesh" style={{ direction: 'ltr' }} />
          </Form.Item>
          <Form.Item name="sortOrder" label="ترتیب نمایش">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="فعال" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
