import { useState } from 'react'
import { Table, Input, Button, Tag, Space, Typography, Popconfirm, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AdminUser } from '@/types/api'
import { useAdminUsers, useUpdateUser } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography
const { Search } = Input

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const { data, isLoading } = useAdminUsers(page, search)
  const updateUser = useUpdateUser()

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleToggleActive(user: AdminUser) {
    updateUser.mutate(
      { userId: user.id, data: { isActive: !user.isActive } },
      {
        onSuccess: () => void messageApi.success(fa.users.updated),
        onError: () => void messageApi.error(fa.common.error),
      },
    )
  }

  function handleMakeAdmin(user: AdminUser) {
    updateUser.mutate(
      { userId: user.id, data: { role: 'ADMIN' } },
      {
        onSuccess: () => void messageApi.success(fa.users.updated),
        onError: () => void messageApi.error(fa.common.error),
      },
    )
  }

  const columns: ColumnsType<AdminUser> = [
    {
      title: fa.users.phone,
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => <span dir="ltr">{v}</span>,
    },
    {
      title: fa.users.name,
      dataIndex: 'name',
      key: 'name',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: fa.users.plan,
      key: 'plan',
      render: (_, record) => record.subscription?.plan.name ?? fa.users.noplan,
    },
    {
      title: fa.users.status,
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? fa.users.active : fa.users.inactive}</Tag>
      ),
    },
    {
      title: fa.users.role,
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => (
        <Tag color={v === 'ADMIN' ? 'purple' : 'default'}>{v}</Tag>
      ),
    },
    {
      title: fa.common.actions,
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type={record.isActive ? 'default' : 'primary'}
            onClick={() => handleToggleActive(record)}
            loading={updateUser.isPending}
          >
            {record.isActive ? fa.users.disable : fa.users.enable}
          </Button>
          {record.role !== 'ADMIN' && (
            <Popconfirm
              title={fa.common.confirm}
              onConfirm={() => handleMakeAdmin(record)}
            >
              <Button size="small" danger>
                {fa.users.makeAdmin}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ marginBottom: 16 }}>
        {fa.users.title}
      </Title>
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder={fa.users.search}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={handleSearch}
          allowClear
          style={{ maxWidth: 320 }}
          enterButton
        />
      </div>
      <Table<AdminUser>
        rowKey="id"
        dataSource={data?.users ?? []}
        columns={columns}
        loading={isLoading}
        locale={{ emptyText: fa.common.noData }}
        pagination={{
          current: page,
          pageSize: 10,
          total: data?.total ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  )
}
