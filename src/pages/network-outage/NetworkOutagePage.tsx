import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fa'
import { Card, Typography, Badge, Button, Popconfirm, Table, message } from 'antd'
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { NetworkOutage } from '@/types/api'
import { useCurrentOutage, useOutageHistory, useStartOutage, useEndOutage } from '@/queries/network-outage.queries'
import { fa } from '@/locales/fa'

dayjs.extend(relativeTime)
dayjs.locale('fa')

const { Title, Text } = Typography

const columns: ColumnsType<NetworkOutage> = [
  {
    title: fa.networkOutage.colStartedAt,
    dataIndex: 'startedAt',
    key: 'startedAt',
    render: (v: string) => dayjs(v).format('YYYY/MM/DD HH:mm'),
  },
  {
    title: fa.networkOutage.colEndedAt,
    dataIndex: 'endedAt',
    key: 'endedAt',
    render: (v: string | null) => (v ? dayjs(v).format('YYYY/MM/DD HH:mm') : '—'),
  },
  {
    title: fa.networkOutage.colDuration,
    dataIndex: 'extendedDays',
    key: 'extendedDays',
    render: (v: number | null) => (v !== null ? v.toFixed(2) : '—'),
  },
  {
    title: fa.networkOutage.colAffected,
    dataIndex: 'affectedCount',
    key: 'affectedCount',
    render: (v: number | null) => v ?? '—',
  },
]

export function NetworkOutagePage() {
  const { data: current, isLoading } = useCurrentOutage()
  const { data: history, isLoading: historyLoading } = useOutageHistory()
  const startOutage = useStartOutage()
  const endOutage = useEndOutage()
  const [messageApi, contextHolder] = message.useMessage()

  const isDown = Boolean(current)

  function handleStart() {
    startOutage.mutate(undefined, {
      onSuccess: () => void messageApi.success(fa.networkOutage.startSuccess),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  function handleEnd() {
    endOutage.mutate(undefined, {
      onSuccess: (outage) =>
        void messageApi.success(
          fa.networkOutage.endSuccess(Math.round((outage.extendedDays ?? 0) * 10) / 10, outage.affectedCount ?? 0),
        ),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 4 }}>{fa.networkOutage.title}</Title>
      <Text type="secondary">{fa.networkOutage.description}</Text>

      <Card style={{ marginTop: 16 }} loading={isLoading}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge status={isDown ? 'error' : 'success'} />
            {isDown ? (
              <DisconnectOutlined style={{ fontSize: 22, color: '#ef4444' }} />
            ) : (
              <WifiOutlined style={{ fontSize: 22, color: '#10b981' }} />
            )}
            <div>
              <Text strong style={{ fontSize: 16, display: 'block' }}>
                {isDown ? fa.networkOutage.disconnected : fa.networkOutage.connected}
              </Text>
              {isDown && current && (
                <Text type="secondary">
                  {fa.networkOutage.startedAt}: {dayjs(current.startedAt).format('YYYY/MM/DD HH:mm')} (
                  {dayjs(current.startedAt).fromNow(true)})
                </Text>
              )}
            </div>
          </div>

          {isDown ? (
            <Popconfirm
              title={fa.networkOutage.endConfirm}
              onConfirm={handleEnd}
              okText={fa.common.confirm}
              cancelText={fa.common.cancel}
            >
              <Button type="primary" loading={endOutage.isPending}>
                {fa.networkOutage.endOutage}
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={fa.networkOutage.startConfirm}
              onConfirm={handleStart}
              okText={fa.common.confirm}
              cancelText={fa.common.cancel}
            >
              <Button danger loading={startOutage.isPending}>
                {fa.networkOutage.startOutage}
              </Button>
            </Popconfirm>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title={fa.networkOutage.historyTitle}>
        <Table<NetworkOutage>
          rowKey="id"
          dataSource={history ?? []}
          columns={columns}
          loading={historyLoading}
          pagination={false}
          locale={{ emptyText: fa.networkOutage.noHistory }}
        />
      </Card>
    </div>
  )
}
