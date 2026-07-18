import { useState } from 'react'
import dayjs from 'dayjs'
import { Button, Card, Form, Input, Modal, Select, Table, Tag, Typography, message } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { PushCampaign, PushCampaignSegment } from '@/types/api'
import { usePushCampaigns, useSendPushNotification } from '@/queries/push-notifications.queries'
import { usePlans } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title, Paragraph } = Typography
const { TextArea } = Input

interface FormValues {
  title: string
  body: string
  segment: PushCampaignSegment
  phoneListText?: string
  planIds?: string[]
}

const SEGMENT_OPTIONS: PushCampaignSegment[] = [
  'ALL',
  'REGISTERED_ONLY',
  'ANONYMOUS_ONLY',
  'ACTIVE_SUBSCRIBERS',
  'BY_PLAN',
  'PHONE_LIST',
]

export function PushNotificationsPage() {
  const [page, setPage] = useState(1)
  const [form] = Form.useForm<FormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const segment = Form.useWatch('segment', form)

  const { data, isLoading } = usePushCampaigns(page)
  const { data: plans } = usePlans()
  const sendPush = useSendPushNotification()

  const planNameById = Object.fromEntries((plans ?? []).map((p) => [p.id, p.name]))

  function submit(values: FormValues) {
    const phoneList = values.segment === 'PHONE_LIST'
      ? (values.phoneListText ?? '').split('\n').map((p) => p.trim()).filter(Boolean)
      : undefined
    const planIds = values.segment === 'BY_PLAN' ? values.planIds : undefined

    Modal.confirm({
      title: fa.pushNotifications.sendConfirmTitle,
      content: fa.pushNotifications.sendConfirmContent,
      okText: fa.pushNotifications.send,
      onOk: () =>
        sendPush.mutateAsync({ title: values.title, body: values.body, segment: values.segment, phoneList, planIds }).then(() => {
          messageApi.success(fa.pushNotifications.sendSuccess)
          form.resetFields()
        }),
    })
  }

  const columns: ColumnsType<PushCampaign> = [
    { title: fa.pushNotifications.colTitle, dataIndex: 'title' },
    {
      title: fa.pushNotifications.colSegment,
      dataIndex: 'segment',
      render: (segment: PushCampaignSegment, record) => (
        <>
          <Tag>{fa.pushNotifications.segmentLabels[segment] ?? segment}</Tag>
          {segment === 'BY_PLAN' && record.planIds.map((id) => (
            <Tag key={id} color="green">{planNameById[id] ?? id}</Tag>
          ))}
        </>
      ),
    },
    { title: fa.pushNotifications.colSent, dataIndex: 'sentCount' },
    { title: fa.pushNotifications.colFailed, dataIndex: 'failedCount' },
    {
      title: fa.pushNotifications.colCreatedAt,
      dataIndex: 'createdAt',
      render: (createdAt: string) => dayjs(createdAt).format('YYYY/MM/DD HH:mm'),
    },
  ]

  return (
    <div style={{ direction: 'rtl' }}>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 4 }}>
        {fa.pushNotifications.title}
      </Title>
      <Paragraph type="secondary">{fa.pushNotifications.description}</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{ segment: 'ALL' }}
          onFinish={submit}
        >
          <Form.Item
            name="title"
            label={fa.pushNotifications.formTitleLabel}
            rules={[{ required: true }]}
          >
            <Input maxLength={100} showCount />
          </Form.Item>

          <Form.Item
            name="body"
            label={fa.pushNotifications.formBodyLabel}
            rules={[{ required: true }]}
          >
            <TextArea rows={3} maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="segment"
            label={fa.pushNotifications.formSegmentLabel}
            rules={[{ required: true }]}
          >
            <Select
              options={SEGMENT_OPTIONS.map((value) => ({
                value,
                label: fa.pushNotifications.segmentLabels[value] ?? value,
              }))}
            />
          </Form.Item>

          {segment === 'PHONE_LIST' && (
            <Form.Item
              name="phoneListText"
              label={fa.pushNotifications.formPhoneListLabel}
              rules={[{ required: true }]}
            >
              <TextArea rows={5} placeholder={'09121234567\n09123456789'} />
            </Form.Item>
          )}

          {segment === 'BY_PLAN' && (
            <Form.Item
              name="planIds"
              label={fa.pushNotifications.formPlanIdsLabel}
              rules={[{ required: true }]}
            >
              <Select
                mode="multiple"
                options={(plans ?? []).map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sendPush.isPending}>
              {fa.pushNotifications.send}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={fa.pushNotifications.historyTitle}>
        <Table<PushCampaign>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: fa.pushNotifications.empty }}
          pagination={{
            current: page,
            total: data?.total ?? 0,
            pageSize: data?.pageSize ?? 30,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  )
}
