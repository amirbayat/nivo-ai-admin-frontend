import { useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Plan } from '@/types/api'
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface PlanFormValues {
  name: string
  priceMonthly: number
  dailyFreeTokens: number
  monthlyTotalTokens: number
  allowedModels: string
  sortOrder: number
  isActive: boolean
}

export function PlansPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form] = Form.useForm<PlanFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: plans, isLoading } = usePlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const deletePlan = useDeletePlan()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ isActive: true, sortOrder: 0 })
    setOpen(true)
  }

  function openEdit(plan: Plan) {
    setEditing(plan)
    form.setFieldsValue({
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      dailyFreeTokens: plan.dailyFreeTokens,
      monthlyTotalTokens: plan.monthlyTotalTokens,
      allowedModels: plan.allowedModels.join(', '),
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const models = values.allowedModels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = {
        name: values.name,
        priceMonthly: values.priceMonthly,
        dailyFreeTokens: values.dailyFreeTokens,
        monthlyTotalTokens: values.monthlyTotalTokens,
        allowedModels: models,
        features: {},
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      }
      const onSuccess = () => {
        void messageApi.success(fa.plans.saved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updatePlan.mutate({ id: editing.id, data: payload }, { onSuccess, onError })
      } else {
        createPlan.mutate(payload, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deletePlan.mutate(id, {
      onSuccess: () => void messageApi.success(fa.plans.deleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const columns: ColumnsType<Plan> = [
    { title: fa.plans.name, dataIndex: 'name', key: 'name' },
    {
      title: fa.plans.price,
      dataIndex: 'priceMonthly',
      key: 'priceMonthly',
      render: (v: number) => v.toLocaleString('fa-IR'),
    },
    { title: fa.plans.dailyFree, dataIndex: 'dailyFreeTokens', key: 'dailyFreeTokens' },
    { title: fa.plans.monthlyTotal, dataIndex: 'monthlyTotalTokens', key: 'monthlyTotalTokens' },
    {
      title: fa.plans.models,
      dataIndex: 'allowedModels',
      key: 'allowedModels',
      render: (models: string[]) => (
        <Space wrap>
          {models.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </Space>
      ),
    },
    { title: fa.plans.sortOrder, dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: fa.plans.active,
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? fa.plans.active : '—'}</Tag>,
    },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            {fa.plans.editPlan}
          </Button>
          <Popconfirm
            title={fa.plans.deleteConfirm}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger loading={deletePlan.isPending}>
              {fa.plans.deletePlan}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const isSaving = createPlan.isPending || updatePlan.isPending

  return (
    <div>
      {contextHolder}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {fa.plans.title}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {fa.plans.addPlan}
        </Button>
      </div>
      <Table<Plan>
        rowKey="id"
        dataSource={plans ?? []}
        columns={columns}
        loading={isLoading}
        locale={{ emptyText: fa.common.noData }}
        pagination={false}
      />
      <Modal
        open={open}
        title={editing ? fa.plans.editPlan : fa.plans.addPlan}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={isSaving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label={fa.plans.name} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priceMonthly" label={fa.plans.price} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="dailyFreeTokens" label={fa.plans.dailyFree} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="monthlyTotalTokens"
            label={fa.plans.monthlyTotal}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="allowedModels" label={fa.plans.models} rules={[{ required: true }]}>
            <Input placeholder="gpt-4o, claude-3-5-sonnet" />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.plans.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label={fa.plans.active} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
