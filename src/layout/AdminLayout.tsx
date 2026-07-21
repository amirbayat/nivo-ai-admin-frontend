import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Badge, theme } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  PayCircleOutlined,
  MessageOutlined,
  LikeOutlined,
  CustomerServiceOutlined,
  RobotOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  RocketOutlined,
  ApartmentOutlined,
  ShopOutlined,
  ReadOutlined,
  TagsOutlined,
  CommentOutlined,
  GiftOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  DisconnectOutlined,
  BellOutlined,
  SendOutlined,
  RadarChartOutlined,
  EyeInvisibleOutlined,
  FunnelPlotOutlined,
} from '@ant-design/icons'
import { useLogout } from '@/queries/auth.queries'
import { useUnreadNotificationCount } from '@/queries/admin-notifications.queries'
import { fa } from '@/locales/fa'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: fa.nav.dashboard },
  { key: '/admin/live-stats', icon: <ThunderboltOutlined />, label: fa.nav.liveStats },
  { key: '/admin/users', icon: <UserOutlined />, label: fa.nav.users },
  { key: '/admin/plans', icon: <AppstoreOutlined />, label: fa.nav.plans },
  { key: '/admin/models', icon: <RobotOutlined />, label: fa.nav.models },
  { key: '/admin/model-routing', icon: <ApartmentOutlined />, label: fa.nav.modelRouting },
  { key: '/admin/model-feedback', icon: <LikeOutlined />, label: fa.nav.modelFeedback },
  { key: '/admin/chat-config', icon: <CommentOutlined />, label: fa.nav.chatConfig },
  { key: '/admin/growth', icon: <GiftOutlined />, label: fa.nav.growth },
  { key: '/admin/analytics', icon: <BarChartOutlined />, label: fa.nav.analytics },
  { key: '/admin/behavior', icon: <RadarChartOutlined />, label: fa.nav.behavior },
  { key: '/admin/anon-chat-config', icon: <EyeInvisibleOutlined />, label: fa.nav.anonChatConfig },
  { key: '/admin/anon-analytics', icon: <FunnelPlotOutlined />, label: fa.nav.anonAnalytics },
  { key: '/admin/sales-bot', icon: <ShopOutlined />, label: fa.nav.salesBot },
  { key: '/admin/campaigns', icon: <RocketOutlined />, label: fa.nav.campaigns },
  { key: '/admin/articles', icon: <ReadOutlined />, label: fa.nav.articles },
  { key: '/admin/article-categories', icon: <TagsOutlined />, label: fa.nav.articleCategories },
  { key: '/admin/payments', icon: <PayCircleOutlined />, label: fa.nav.payments },
  { key: '/admin/feedback', icon: <MessageOutlined />, label: fa.nav.feedback },
  { key: '/admin/tickets', icon: <CustomerServiceOutlined />, label: fa.nav.tickets },
  { key: '/admin/otp', icon: <KeyOutlined />, label: fa.nav.otp },
  { key: '/admin/network-outage', icon: <DisconnectOutlined />, label: fa.nav.networkOutage },
  { key: '/admin/notifications', icon: <BellOutlined />, label: fa.nav.notifications },
  { key: '/admin/push-notifications', icon: <SendOutlined />, label: fa.nav.pushNotifications },
]

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useLogout()
  const { data: unreadCount } = useUnreadNotificationCount()
  const { token } = theme.useToken()

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true })
      },
    })
  }

  return (
    <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{ position: 'fixed', height: '100vh', right: 0, top: 0, zIndex: 100 }}
      >
        {/* antd خودش یک div داخلی (.ant-layout-sider-children، height:100%) دور بچه‌های Sider
            می‌پیچد — یعنی این‌جا اولین لایه‌ای است که واقعاً می‌شود رویش flex گذاشت؛ روی خودِ
            Sider گذاشتنش بی‌اثر بود چون آن div داخلی، نه این استایل، پدر مستقیم بچه‌ها می‌شد */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              height: 64,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: collapsed ? 14 : 16,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {collapsed ? 'PA' : 'پنل مدیریت'}
          </div>
          {/* آیتم‌های منو دارن زیاد می‌شن — بدون این scroll، آیتم‌های آخر روی صفحه‌های کوتاه‌تر
              از دید خارج می‌شدن و هیچ راهی برای رسیدن بهشون نبود */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ borderLeft: 'none' }}
            />
          </div>
        </div>
      </Sider>
      <Layout
        style={{
          marginRight: collapsed ? 80 : 200,
          transition: 'margin-right 0.2s',
        }}
      >
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Text strong style={{ fontSize: 16 }}>
            {fa.dashboard.title}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge count={unreadCount ?? 0} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/admin/notifications')}
              />
            </Badge>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              loading={logout.isPending}
            >
              {fa.nav.logout}
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
