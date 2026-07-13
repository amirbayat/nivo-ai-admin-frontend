import { Table, Typography, Tag, Alert, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import type { ActiveOtp } from '@/types/api'
import { useActiveOtps } from '@/queries/otp.queries'

const { Title, Text } = Typography

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const columns: ColumnsType<ActiveOtp> = [
  {
    title: 'شماره موبایل',
    dataIndex: 'phone',
    key: 'phone',
    render: (v: string) => <Text dir="ltr">{v}</Text>,
  },
  {
    title: 'نام کاربر',
    dataIndex: 'name',
    key: 'name',
    render: (v: string | null) => v ?? <Text type="secondary">کاربر جدید</Text>,
  },
  {
    title: 'کد',
    dataIndex: 'code',
    key: 'code',
    render: (v: string) => (
      <Text dir="ltr" strong style={{ fontFamily: 'monospace', fontSize: 16 }}>
        {v}
      </Text>
    ),
  },
  {
    title: 'اعتبار باقی‌مانده',
    dataIndex: 'expiresInSeconds',
    key: 'expiresInSeconds',
    render: (v: number) => <Tag color={v <= 20 ? 'red' : v <= 60 ? 'orange' : 'green'}>{formatRemaining(v)}</Tag>,
    sorter: (a, b) => a.expiresInSeconds - b.expiresInSeconds,
  },
]

export function OtpListPage() {
  const { data, isLoading, isFetching, isError, error, refetch } = useActiveOtps()

  if (isError) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    return (
      <div>
        <Title level={4}>کدهای OTP فعال</Title>
        <Alert
          type={status === 403 ? 'warning' : 'error'}
          showIcon
          message={status === 403 ? 'این قابلیت خاموش است' : 'خطا در دریافت لیست'}
          description={
            status === 403
              ? 'نمایش کدهای OTP از طریق env variable «OTP_ADMIN_VIEWER_ENABLED» روی بک‌اند غیرفعال شده است.'
              : 'دوباره تلاش کنید.'
          }
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>کدهای OTP فعال</Title>
        <Button icon={<ReloadOutlined />} onClick={() => void refetch()} loading={isFetching}>
          به‌روزرسانی
        </Button>
      </div>
      <Text type="secondary">
        فقط کدهایی که هنوز منقضی نشده‌اند نشان داده می‌شوند — این لیست هر ۵ ثانیه خودکار به‌روز می‌شود.
      </Text>
      <Table
        style={{ marginTop: 16 }}
        rowKey="phone"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: 'در حال حاضر هیچ کد فعالی وجود ندارد' }}
      />
    </div>
  )
}
