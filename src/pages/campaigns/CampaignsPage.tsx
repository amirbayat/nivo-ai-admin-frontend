import { useState } from 'react'
import dayjs from 'dayjs'
import {
  Table, Button, Drawer, Form, Input, InputNumber, DatePicker, Switch,
  Space, Tag, Progress, Popconfirm, Typography, message, Divider,
} from 'antd'
import { PlusOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { LaunchCampaign } from '@/types/api'
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useCloseCampaign } from '@/queries/campaign.queries'
import { fa } from '@/locales/fa'
import { WaitlistDrawer } from './WaitlistDrawer'

const { Title, Text } = Typography

interface CampaignFormValues {
  name: string
  startAt: dayjs.Dayjs
  endAt: dayjs.Dayjs | null
  capacity: number
  maxWaitlistSize: number | null
  waitlistMessage: string
  waitlistFullMessage: string | null
  waitlistDailyMessageLimit: number
  displayCounterEnabled: boolean
  displayInitialPctMin: number
  displayInitialPctMax: number
  displayFloorMin: number
  displayFloorMax: number
  displayAnimationTickMs: number
  displayDecrementMin: number
  displayDecrementMax: number
  grantedSmsTemplate: string | null
  reminderSteps: { dayOffset: number; template: string }[]
}

export function CampaignsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LaunchCampaign | null>(null)
  const [waitlistCampaign, setWaitlistCampaign] = useState<LaunchCampaign | null>(null)
  const [form] = Form.useForm<CampaignFormValues>()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: campaigns, isLoading } = useCampaigns()
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const closeCampaign = useCloseCampaign()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      startAt: dayjs(),
      endAt: null,
      maxWaitlistSize: null,
      waitlistDailyMessageLimit: 4,
      displayCounterEnabled: true,
      displayInitialPctMin: 15,
      displayInitialPctMax: 25,
      displayFloorMin: 3,
      displayFloorMax: 8,
      displayAnimationTickMs: 500,
      displayDecrementMin: 1,
      displayDecrementMax: 3,
      reminderSteps: [],
    })
    setFormOpen(true)
  }

  function openEdit(campaign: LaunchCampaign) {
    setEditing(campaign)
    form.setFieldsValue({
      ...campaign,
      startAt: dayjs(campaign.startAt),
      endAt: campaign.endAt ? dayjs(campaign.endAt) : null,
    })
    setFormOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const data = {
        ...values,
        startAt: values.startAt.toISOString(),
        endAt: values.endAt ? values.endAt.toISOString() : null,
      }
      const onSuccess = () => {
        void messageApi.success(fa.common.success)
        setFormOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)
      if (editing) updateCampaign.mutate({ id: editing.id, data: data as never }, { onSuccess, onError })
      else createCampaign.mutate(data as never, { onSuccess, onError })
    })
  }

  const columns: ColumnsType<LaunchCampaign> = [
    { title: fa.campaigns.name, dataIndex: 'name', key: 'name' },
    {
      title: fa.campaigns.status,
      dataIndex: 'status',
      key: 'status',
      render: (v: LaunchCampaign['status']) => (
        <Tag color={v === 'ACTIVE' ? 'green' : 'default'}>{v === 'ACTIVE' ? fa.campaigns.active : fa.campaigns.closed}</Tag>
      ),
    },
    {
      title: `${fa.campaigns.capacity} / ${fa.campaigns.grantedCount}`,
      key: 'capacity',
      render: (_, r) => (
        <Space direction="vertical" size={0} style={{ minWidth: 140 }}>
          <Text>{r.grantedCount} / {r.capacity}</Text>
          <Progress percent={Math.round((r.grantedCount / Math.max(r.capacity, 1)) * 100)} size="small" showInfo={false} />
        </Space>
      ),
    },
    {
      title: fa.campaigns.startAt,
      dataIndex: 'startAt',
      key: 'startAt',
      render: (v: string) => new Date(v).toLocaleDateString('fa-IR'),
    },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<UnorderedListOutlined />} onClick={() => setWaitlistCampaign(r)}>
            {fa.campaigns.viewWaitlist}
          </Button>
          <Button size="small" onClick={() => openEdit(r)}>ویرایش</Button>
          {r.status === 'ACTIVE' && (
            <Popconfirm title={fa.campaigns.close + '؟'} onConfirm={() => closeCampaign.mutate(r.id)}>
              <Button size="small" danger>{fa.campaigns.close}</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.campaigns.title}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{fa.campaigns.addCampaign}</Button>
      </div>

      <Table<LaunchCampaign>
        rowKey="id"
        dataSource={campaigns ?? []}
        columns={columns}
        loading={isLoading}
        locale={{ emptyText: fa.common.noData }}
        scroll={{ x: 'max-content' }}
      />

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? fa.campaigns.editCampaign : fa.campaigns.addCampaign}
        width={520}
        extra={
          <Button type="primary" onClick={handleSave} loading={createCampaign.isPending || updateCampaign.isPending}>
            {fa.common.save}
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={fa.campaigns.name} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="startAt" label={fa.campaigns.startAt} rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="endAt" label={fa.campaigns.endAt}>
              <DatePicker showTime style={{ width: 220 }} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="capacity" label={fa.campaigns.capacity} rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="maxWaitlistSize" label={fa.campaigns.maxWaitlistSize}>
              <InputNumber min={1} style={{ width: 200 }} placeholder="بدون سقف" />
            </Form.Item>
          </Space>

          <Divider />

          <Form.Item name="waitlistMessage" label={fa.campaigns.waitlistMessage} rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="waitlistFullMessage" label={fa.campaigns.waitlistFullMessage}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="waitlistDailyMessageLimit" label={fa.campaigns.waitlistDailyMessageLimit}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Divider>{fa.campaigns.displaySettings}</Divider>

          <Form.Item name="displayCounterEnabled" label={fa.campaigns.displayCounterEnabled} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space wrap>
            <Form.Item name="displayInitialPctMin" label={fa.campaigns.displayInitialPctMin}>
              <InputNumber min={1} max={100} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="displayInitialPctMax" label={fa.campaigns.displayInitialPctMax}>
              <InputNumber min={1} max={100} style={{ width: 140 }} />
            </Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="displayFloorMin" label={fa.campaigns.displayFloorMin}>
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="displayFloorMax" label={fa.campaigns.displayFloorMax}>
              <InputNumber min={0} style={{ width: 140 }} />
            </Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="displayAnimationTickMs" label={fa.campaigns.displayAnimationTickMs}>
              <InputNumber min={50} step={50} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="displayDecrementMin" label={fa.campaigns.displayDecrementMin}>
              <InputNumber min={1} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="displayDecrementMax" label={fa.campaigns.displayDecrementMax}>
              <InputNumber min={1} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Divider>پیامک</Divider>

          <Form.Item
            name="grantedSmsTemplate"
            label={fa.campaigns.grantedSmsTemplate}
            extra="باید از قبل در پنل کاوه‌نگار به‌عنوان الگو ثبت و تأیید شده باشد"
          >
            <Input placeholder="waitlist-granted" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item label={fa.campaigns.reminderSteps} extra={fa.campaigns.reminderStepsHint}>
            <Form.List name="reminderSteps">
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        {...field}
                        name={[field.name, 'dayOffset']}
                        rules={[{ required: true }]}
                        noStyle
                      >
                        <InputNumber min={1} placeholder={fa.campaigns.dayOffset} style={{ width: 140 }} />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'template']}
                        rules={[{ required: true }]}
                        noStyle
                      >
                        <Input placeholder={fa.campaigns.template} style={{ width: 220, fontFamily: 'monospace' }} />
                      </Form.Item>
                      <DeleteOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ dayOffset: 1, template: '' })}>
                    {fa.campaigns.addStep}
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Drawer>

      <WaitlistDrawer campaign={waitlistCampaign} onClose={() => setWaitlistCampaign(null)} />
    </div>
  )
}
