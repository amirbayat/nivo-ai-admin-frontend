import { useState } from 'react'
import { Drawer, Table, Tag, Select, Space, Button, InputNumber, Input, message, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { LaunchCampaign, WaitlistEntry } from '@/types/api'
import { useWaitlist, useGrantAccess, useGrantAccessToPhone } from '@/queries/campaign.queries'
import { fa } from '@/locales/fa'

const STATUS_COLORS: Record<WaitlistEntry['status'], string> = {
  WAITING: 'orange',
  GRANTED: 'blue',
  ACTIVATED: 'green',
}

export function WaitlistDrawer({ campaign, onClose }: { campaign: LaunchCampaign | null; onClose: () => void }) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [grantCount, setGrantCount] = useState<number>(10)
  const [grantPhone, setGrantPhone] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const { data: entries, isLoading } = useWaitlist(campaign?.id ?? '', statusFilter)
  const grantAccess = useGrantAccess()
  const grantByPhone = useGrantAccessToPhone()

  function handleGrantFirstN() {
    if (!campaign) return
    grantAccess.mutate(
      { campaignId: campaign.id, mode: grantCount },
      { onSuccess: (r) => void messageApi.success(fa.campaigns.grantSuccess(r.granted)) },
    )
  }

  function handleGrantAll() {
    if (!campaign) return
    grantAccess.mutate(
      { campaignId: campaign.id, mode: 'all' },
      { onSuccess: (r) => void messageApi.success(fa.campaigns.grantSuccess(r.granted)) },
    )
  }

  function handleGrantPhone() {
    if (!grantPhone) return
    grantByPhone.mutate(grantPhone, {
      onSuccess: (r) => {
        if (r.granted) {
          void messageApi.success(fa.campaigns.grantSuccess(1))
          setGrantPhone('')
        } else {
          void messageApi.warning(fa.campaigns.grantPhoneNotFound)
        }
      },
    })
  }

  const columns: ColumnsType<WaitlistEntry> = [
    { title: fa.campaigns.phone, dataIndex: 'phone', key: 'phone' },
    {
      title: fa.campaigns.status,
      dataIndex: 'status',
      key: 'status',
      render: (v: WaitlistEntry['status']) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
    },
    {
      title: fa.campaigns.registeredAt,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('fa-IR'),
    },
    {
      title: 'یادآوری آخر',
      dataIndex: 'lastReminderStepSent',
      key: 'lastReminderStepSent',
      render: (v: number | null) => (v === null ? '—' : `مرحله‌ی ${v + 1}`),
    },
  ]

  return (
    <Drawer
      open={!!campaign}
      onClose={onClose}
      title={campaign ? fa.campaigns.waitlistTitle(campaign.name) : ''}
      width={720}
    >
      {contextHolder}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder={fa.campaigns.filterAll}
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: fa.campaigns.filterWaiting, value: 'WAITING' },
              { label: fa.campaigns.filterGranted, value: 'GRANTED' },
              { label: fa.campaigns.filterActivated, value: 'ACTIVATED' },
            ]}
          />
        </Space>
        <Space wrap>
          <InputNumber min={1} value={grantCount} onChange={(v) => setGrantCount(v ?? 1)} />
          <Popconfirm title={fa.campaigns.grantFirstN + '؟'} onConfirm={handleGrantFirstN}>
            <Button loading={grantAccess.isPending}>{fa.campaigns.grantFirstN}</Button>
          </Popconfirm>
          <Popconfirm title={fa.campaigns.grantAll + '؟'} onConfirm={handleGrantAll}>
            <Button danger loading={grantAccess.isPending}>{fa.campaigns.grantAll}</Button>
          </Popconfirm>
        </Space>
        <Space wrap>
          <Input
            placeholder="09xxxxxxxxx"
            style={{ width: 180 }}
            value={grantPhone}
            onChange={(e) => setGrantPhone(e.target.value)}
          />
          <Button onClick={handleGrantPhone} loading={grantByPhone.isPending}>
            {fa.campaigns.grantByPhone}
          </Button>
        </Space>
      </Space>

      <Table<WaitlistEntry>
        rowKey="id"
        dataSource={entries ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: fa.common.noData }}
      />
    </Drawer>
  )
}
