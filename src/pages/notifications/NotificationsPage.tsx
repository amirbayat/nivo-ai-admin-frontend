import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fa'
import { Badge, Button, Card, Empty, List, Pagination, Tag, Typography } from 'antd'
import {
  PayCircleOutlined,
  WalletOutlined,
  CustomerServiceOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { AdminNotification, AdminNotificationType } from '@/types/api'
import {
  useAdminNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useUnreadNotificationCount,
} from '@/queries/admin-notifications.queries'
import { fa } from '@/locales/fa'

dayjs.extend(relativeTime)
dayjs.locale('fa')

const { Title, Text, Paragraph } = Typography

const TYPE_ICONS: Record<AdminNotificationType, React.ReactNode> = {
  PAYMENT_COMPLETED: <PayCircleOutlined style={{ color: '#10b981' }} />,
  WALLET_TOPUP_COMPLETED: <WalletOutlined style={{ color: '#10b981' }} />,
  TICKET_CREATED: <CustomerServiceOutlined style={{ color: '#3b82f6' }} />,
  SYSTEM_ERROR_SPIKE: <WarningOutlined style={{ color: '#ef4444' }} />,
  LIARA_ERROR_RATE: <ThunderboltOutlined style={{ color: '#f59e0b' }} />,
}

// اسم ادمین لاگین‌شده در این پروژه سمت کلاینت جایی ذخیره نمی‌شود (فقط JWT در localStorage)،
// پس «خوانده‌شده برای من» را با شناسه‌ی ادمین از پاسخ /auth/me نمی‌گیریم — سرور خودش با
// req.user.sub این را تشخیص می‌دهد؛ اینجا فقط readBy.length>0 به‌عنوان نشانه‌ی نمایشی کافی‌ست
function isRead(n: AdminNotification): boolean {
  return n.readBy.length > 0
}

export function NotificationsPage({ embedded = false }: { embedded?: boolean }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminNotifications(page)
  const { data: unreadCount } = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  return (
    <div style={{ padding: embedded ? 12 : 0, direction: 'rtl' }}>
      {!embedded && (
        <>
          <Title level={4} style={{ marginBottom: 4 }}>
            {fa.adminNotifications.title}
          </Title>
          <Paragraph type="secondary">{fa.adminNotifications.description}</Paragraph>
        </>
      )}

      <Card
        loading={isLoading}
        title={
          <Badge count={unreadCount ?? 0} offset={[10, 0]}>
            <span>{fa.adminNotifications.title}</span>
          </Badge>
        }
        extra={
          <Button
            size="small"
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
            disabled={!unreadCount}
          >
            {fa.adminNotifications.markAllRead}
          </Button>
        }
      >
        <List<AdminNotification>
          dataSource={data?.items ?? []}
          locale={{ emptyText: <Empty description={fa.adminNotifications.empty} /> }}
          renderItem={(item) => (
            <List.Item
              actions={
                isRead(item)
                  ? []
                  : [
                      <Button
                        key="read"
                        size="small"
                        type="link"
                        onClick={() => markRead.mutate(item.id)}
                        loading={markRead.isPending}
                      >
                        {fa.adminNotifications.markRead}
                      </Button>,
                    ]
              }
            >
              <List.Item.Meta
                avatar={<span style={{ fontSize: 20 }}>{TYPE_ICONS[item.type]}</span>}
                title={
                  <span>
                    {item.title}{' '}
                    {!isRead(item) && (
                      <Tag color="blue" style={{ marginInlineStart: 8 }}>
                        {fa.adminNotifications.unread}
                      </Tag>
                    )}
                  </span>
                }
                description={
                  <>
                    <div>{item.body}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.createdAt).fromNow()} — {dayjs(item.createdAt).format('YYYY/MM/DD HH:mm')}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />

        {!!data?.total && data.total > data.pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={data.pageSize}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
