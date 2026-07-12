import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, theme } from 'antd'
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
} from '@ant-design/icons'
import { useLogout } from '@/queries/auth.queries'
import { fa } from '@/locales/fa'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: fa.nav.dashboard },
  { key: '/admin/users', icon: <UserOutlined />, label: fa.nav.users },
  { key: '/admin/plans', icon: <AppstoreOutlined />, label: fa.nav.plans },
  { key: '/admin/models', icon: <RobotOutlined />, label: fa.nav.models },
  { key: '/admin/model-routing', icon: <ApartmentOutlined />, label: fa.nav.modelRouting },
  { key: '/admin/model-feedback', icon: <LikeOutlined />, label: fa.nav.modelFeedback },
  { key: '/admin/analytics', icon: <BarChartOutlined />, label: fa.nav.analytics },
  { key: '/admin/sales-bot', icon: <ShopOutlined />, label: fa.nav.salesBot },
  { key: '/admin/campaigns', icon: <RocketOutlined />, label: fa.nav.campaigns },
  { key: '/admin/articles', icon: <ReadOutlined />, label: fa.nav.articles },
  { key: '/admin/article-categories', icon: <TagsOutlined />, label: fa.nav.articleCategories },
  { key: '/admin/payments', icon: <PayCircleOutlined />, label: fa.nav.payments },
  { key: '/admin/feedback', icon: <MessageOutlined />, label: fa.nav.feedback },
  { key: '/admin/tickets', icon: <CustomerServiceOutlined />, label: fa.nav.tickets },
]

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useLogout()
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
        <div
          style={{
            height: 64,
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
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderLeft: 'none' }}
        />
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
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            loading={logout.isPending}
          >
            {fa.nav.logout}
          </Button>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
