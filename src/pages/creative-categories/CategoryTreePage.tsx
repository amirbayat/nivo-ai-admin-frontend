import { useMemo, useState } from 'react'
import { Tree, Button, Modal, Form, Input, InputNumber, Switch, TreeSelect, Space, Tag, Popconfirm, Typography, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { CreativeCategory } from '@/types/api'
import {
  useCreativeCategories,
  useCreateCreativeCategory,
  useUpdateCreativeCategory,
  useDeleteCreativeCategory,
} from '@/queries/creative-categories.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface FormValues {
  name: string
  parentId?: string
  sortOrder: number
  isActive: boolean
}

function buildTree(categories: CreativeCategory[], parentId: string | null): DataNode[] {
  return categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      key: c.id,
      title: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {c.name}
          {!c.isActive && <Tag color="red" style={{ margin: 0 }}>{fa.creativeCategories.inactive}</Tag>}
        </span>
      ),
      children: buildTree(categories, c.id),
    }))
}

function buildTreeSelectOptions(categories: CreativeCategory[], parentId: string | null, excludeId?: string): DataNode[] {
  return categories
    .filter(c => c.parentId === parentId && c.id !== excludeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      key: c.id,
      value: c.id,
      title: c.name,
      children: buildTreeSelectOptions(categories, c.id, excludeId),
    }))
}

export function CategoryTreePage() {
  const { data: categories, isLoading } = useCreativeCategories()
  const createCategory = useCreateCreativeCategory()
  const updateCategory = useUpdateCreativeCategory()
  const deleteCategory = useDeleteCreativeCategory()
  const [form] = Form.useForm<FormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CreativeCategory | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const treeData = useMemo(() => buildTree(categories ?? [], null), [categories])
  const selectOptions = useMemo(
    () => buildTreeSelectOptions(categories ?? [], null, editing?.id),
    [categories, editing],
  )

  function openAdd(parentId?: string) {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ parentId, sortOrder: 0, isActive: true })
    setOpen(true)
  }

  function openEdit(category: CreativeCategory) {
    setEditing(category)
    form.setFieldsValue({
      name: category.name,
      parentId: category.parentId ?? undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then(values => {
      const onSuccess = () => {
        void messageApi.success(fa.creativeCategories.saved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updateCategory.mutate(
          { id: editing.id, data: { ...values, parentId: values.parentId ?? null } },
          { onSuccess, onError },
        )
      } else {
        createCategory.mutate(values, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deleteCategory.mutate(id, {
      onSuccess: () => void messageApi.success(fa.creativeCategories.deleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  function findCategory(id: string): CreativeCategory | undefined {
    return categories?.find(c => c.id === id)
  }

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.creativeCategories.title}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd()}>
          {fa.creativeCategories.addRoot}
        </Button>
      </div>
      <p style={{ color: '#888', marginBottom: 16 }}>{fa.creativeCategories.hint}</p>

      {isLoading ? (
        <p>{fa.common.loading}</p>
      ) : !categories?.length ? (
        <p>{fa.common.noData}</p>
      ) : (
        <Tree
          treeData={treeData}
          defaultExpandAll
          blockNode
          titleRender={(node) => {
            const category = findCategory(String(node.key))
            const rawTitle = typeof node.title === 'function' ? node.title(node) : node.title
            if (!category) return rawTitle
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{rawTitle}</span>
                <Space size={4} onClick={e => e.stopPropagation()}>
                  <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => openAdd(category.id)} title={fa.creativeCategories.addChild} />
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(category)} />
                  <Popconfirm title={fa.creativeCategories.deleteConfirm} onConfirm={() => handleDelete(category.id)}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            )
          }}
        />
      )}

      <Modal
        open={open}
        title={editing ? fa.creativeCategories.editCategory : fa.creativeCategories.addCategory}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={createCategory.isPending || updateCategory.isPending}
        width={440}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={fa.creativeCategories.name} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label={fa.creativeCategories.parent}>
            <TreeSelect
              treeData={selectOptions}
              allowClear
              placeholder={fa.creativeCategories.rootPlaceholder}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.creditConfig.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label={fa.creditConfig.active} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
