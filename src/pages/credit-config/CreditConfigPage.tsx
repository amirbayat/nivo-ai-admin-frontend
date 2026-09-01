import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  Card,
  message,
} from 'antd'
import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CreditPackage, CreditPackageScope } from '@/types/api'
import {
  useCreditConfig,
  useUpdateCreditConfig,
  useCreditPackages,
  useCreateCreditPackage,
  useUpdateCreditPackage,
  useDeleteCreditPackage,
} from '@/queries/credit-config.queries'
import { useModels } from '@/queries/admin.queries'
import { fa } from '@/locales/fa'

const { Title } = Typography

interface ConfigFormValues {
  tomanPerCredit: number
  purchaseMarkup: number
  freeSignupCredits: number
  extractionEconomicalModel?: string
  extractionEconomicalCreditCost: number
  extractionPremiumModel?: string
  extractionPremiumCreditCost: number
  sourceImageAccuracyCreditCost: number
}

interface PackageFormValues {
  credits: number
  discountPercent: number
  isPopular: boolean
  isBestValue: boolean
  isCustomAmount: boolean
  isActive: boolean
  sortOrder: number
  scope: CreditPackageScope
}

export function CreditConfigPage() {
  const [configForm] = Form.useForm<ConfigFormValues>()
  const [packageForm] = Form.useForm<PackageFormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CreditPackage | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const { data: config, isLoading: configLoading } = useCreditConfig()
  const updateConfig = useUpdateCreditConfig()
  const { data: packages, isLoading: packagesLoading } = useCreditPackages()
  const createPackage = useCreateCreditPackage()
  const updatePackage = useUpdateCreditPackage()
  const deletePackage = useDeleteCreditPackage()
  const { data: models } = useModels()
  // فقط مدل‌های CHAT با supportsVision — همان استخری که تبدیل عکس‌به‌پرامپت واقعاً از آن انتخاب می‌کند
  const visionModels = (models ?? []).filter((m) => m.modelType === 'CHAT' && m.supportsVision)

  useEffect(() => {
    if (config) {
      configForm.setFieldsValue({
        tomanPerCredit: config.tomanPerCredit,
        purchaseMarkup: config.purchaseMarkup,
        freeSignupCredits: config.freeSignupCredits,
        extractionEconomicalModel: config.extractionEconomicalModel ?? undefined,
        extractionEconomicalCreditCost: config.extractionEconomicalCreditCost,
        extractionPremiumModel: config.extractionPremiumModel ?? undefined,
        extractionPremiumCreditCost: config.extractionPremiumCreditCost,
        sourceImageAccuracyCreditCost: config.sourceImageAccuracyCreditCost,
      })
    }
  }, [config, configForm])

  function handleSaveConfig() {
    configForm.validateFields().then(values => {
      // Select با allowClear خالی‌شده مقدار undefined می‌دهد که axios از JSON حذفش می‌کند
      // (یعنی «بدون تغییر»، نه «پاک کن») — برای این‌که پاک‌کردن واقعاً به حالت خودکار برگردد،
      // صریحاً null می‌فرستیم
      updateConfig.mutate(
        {
          ...values,
          extractionEconomicalModel: values.extractionEconomicalModel ?? null,
          extractionPremiumModel: values.extractionPremiumModel ?? null,
        },
        {
          onSuccess: () => void messageApi.success(fa.creditConfig.configSaved),
          onError: () => void messageApi.error(fa.common.error),
        },
      )
    })
  }

  function openAddPackage() {
    setEditing(null)
    packageForm.resetFields()
    packageForm.setFieldsValue({
      discountPercent: 0,
      isPopular: false,
      isBestValue: false,
      isCustomAmount: false,
      isActive: true,
      sortOrder: packages?.length ?? 0,
      scope: 'GENERAL',
    })
    setOpen(true)
  }

  function openEditPackage(pkg: CreditPackage) {
    setEditing(pkg)
    packageForm.setFieldsValue({
      credits: pkg.credits,
      discountPercent: pkg.discountPercent,
      isPopular: pkg.isPopular,
      isBestValue: pkg.isBestValue,
      isCustomAmount: pkg.isCustomAmount,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
      scope: pkg.scope,
    })
    setOpen(true)
  }

  function handleSavePackage() {
    packageForm.validateFields().then(values => {
      const onSuccess = () => {
        void messageApi.success(fa.creditConfig.packageSaved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updatePackage.mutate({ id: editing.id, data: values }, { onSuccess, onError })
      } else {
        createPackage.mutate(values, { onSuccess, onError })
      }
    })
  }

  function handleDeletePackage(id: string) {
    deletePackage.mutate(id, {
      onSuccess: () => void messageApi.success(fa.creditConfig.packageDeleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  const isCustomAmountWatched: boolean = Form.useWatch('isCustomAmount', packageForm) ?? false

  function computePrice(pkg: CreditPackage): number {
    if (!config) return 0
    const base = pkg.credits * config.tomanPerCredit * config.purchaseMarkup
    return Math.round(base * (1 - pkg.discountPercent / 100))
  }

  const columns: ColumnsType<CreditPackage> = [
    {
      title: fa.creditConfig.credits,
      dataIndex: 'credits',
      key: 'credits',
      width: 140,
      render: (v: number, r) => (
        <span>
          {r.isCustomAmount ? `از ${v.toLocaleString('fa-IR')} به بالا` : v.toLocaleString('fa-IR')}
        </span>
      ),
    },
    {
      title: fa.creditConfig.priceToman,
      key: 'price',
      width: 160,
      render: (_, r) => (
        <span style={{ fontFamily: 'monospace' }}>
          {r.isCustomAmount ? fa.creditConfig.priceFrom(computePrice(r)) : computePrice(r).toLocaleString('fa-IR')}
        </span>
      ),
    },
    {
      title: fa.creditConfig.discountPercent,
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      width: 100,
      render: (v: number) => (v ? `${v}٪` : '—'),
    },
    {
      title: 'برچسب‌ها',
      key: 'badges',
      width: 200,
      render: (_, r) => (
        <Space size={4}>
          {r.isPopular && <Tag color="blue">محبوب</Tag>}
          {r.isBestValue && <Tag color="gold">به‌صرفه‌ترین</Tag>}
          {r.isCustomAmount && <Tag color="purple">مبلغ دلخواه</Tag>}
        </Space>
      ),
    },
    {
      title: fa.creditConfig.sortOrder,
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: fa.creditConfig.scope,
      dataIndex: 'scope',
      key: 'scope',
      width: 150,
      filters: [
        { text: fa.creditConfig.scopeGeneral, value: 'GENERAL' },
        { text: fa.creditConfig.scopeNivoCal, value: 'NIVO_CAL' },
      ],
      onFilter: (value, record) => record.scope === value,
      render: (v: CreditPackageScope) => (
        <Tag color={v === 'NIVO_CAL' ? 'cyan' : 'default'}>
          {v === 'NIVO_CAL' ? fa.creditConfig.scopeNivoCal : fa.creditConfig.scopeGeneral}
        </Tag>
      ),
    },
    {
      title: fa.creditConfig.active,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'فعال' : 'غیرفعال'}</Tag>,
    },
    {
      title: fa.common.actions,
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditPackage(record)}>{fa.creditConfig.editPackage}</Button>
          <Popconfirm title={fa.creditConfig.deleteConfirm} onConfirm={() => handleDeletePackage(record.id)}>
            <Button size="small" danger loading={deletePackage.isPending}>
              {fa.creditConfig.deletePackage}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <Title level={4} style={{ margin: '0 0 16px' }}>{fa.creditConfig.title}</Title>

      <Card title={fa.creditConfig.configSection} loading={configLoading} style={{ marginBottom: 24 }}>
        <Form form={configForm} layout="vertical" onFinish={handleSaveConfig}>
          <Space size="large" wrap align="start">
            <Form.Item name="tomanPerCredit" label={fa.creditConfig.tomanPerCredit} rules={[{ required: true }]}>
              <InputNumber style={{ width: 220 }} min={1} step={100} />
            </Form.Item>
            <Form.Item name="purchaseMarkup" label={fa.creditConfig.purchaseMarkup} rules={[{ required: true }]}>
              <InputNumber style={{ width: 220 }} min={1} step={0.05} />
            </Form.Item>
            <Form.Item name="freeSignupCredits" label={fa.creditConfig.freeSignupCredits} rules={[{ required: true }]}>
              <InputNumber style={{ width: 260 }} min={0} step={5} />
            </Form.Item>
          </Space>

          <Typography.Text type="secondary" style={{ display: 'block', margin: '8px 0 12px' }}>
            {fa.creditConfig.extractionSectionHint}
          </Typography.Text>
          <Title level={5} style={{ margin: '0 0 12px' }}>{fa.creditConfig.extractionSection}</Title>
          <Space size="large" wrap align="start">
            <Form.Item name="extractionEconomicalModel" label={fa.creditConfig.extractionEconomicalModel}>
              <Select
                style={{ width: 260 }}
                allowClear
                placeholder={fa.creditConfig.extractionModelPlaceholder}
                options={visionModels.map((m) => ({ value: m.name, label: m.displayName }))}
              />
            </Form.Item>
            <Form.Item
              name="extractionEconomicalCreditCost"
              label={fa.creditConfig.extractionEconomicalCreditCost}
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: 220 }} min={0} step={1} />
            </Form.Item>
            <Form.Item name="extractionPremiumModel" label={fa.creditConfig.extractionPremiumModel}>
              <Select
                style={{ width: 260 }}
                allowClear
                placeholder={fa.creditConfig.extractionModelPlaceholder}
                options={visionModels.map((m) => ({ value: m.name, label: m.displayName }))}
              />
            </Form.Item>
            <Form.Item
              name="extractionPremiumCreditCost"
              label={fa.creditConfig.extractionPremiumCreditCost}
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: 220 }} min={0} step={1} />
            </Form.Item>
            <Form.Item
              name="sourceImageAccuracyCreditCost"
              label={fa.creditConfig.sourceImageAccuracyCreditCost}
              rules={[{ required: true }]}
              extra={fa.creditConfig.sourceImageAccuracyCreditCostHint}
            >
              <InputNumber style={{ width: 220 }} min={0} step={1} />
            </Form.Item>
          </Space>

          <div>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={updateConfig.isPending}>
              {fa.creditConfig.saveConfig}
            </Button>
          </div>
        </Form>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>{fa.creditConfig.packagesSection}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddPackage}>
          {fa.creditConfig.addPackage}
        </Button>
      </div>

      <Table<CreditPackage>
        rowKey="id"
        dataSource={packages ?? []}
        columns={columns}
        loading={packagesLoading}
        locale={{ emptyText: fa.common.noData }}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        title={editing ? fa.creditConfig.editPackage : fa.creditConfig.addPackage}
        onOk={handleSavePackage}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={createPackage.isPending || updatePackage.isPending}
        width={480}
      >
        <Form form={packageForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="credits"
            label={fa.creditConfig.credits}
            rules={[{ required: true }]}
            extra={isCustomAmountWatched ? fa.creditConfig.creditsCustomHint : undefined}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="discountPercent" label={fa.creditConfig.discountPercent}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="sortOrder" label={fa.creditConfig.sortOrder}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="scope" label={fa.creditConfig.scope} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'GENERAL', label: fa.creditConfig.scopeGeneral },
                { value: 'NIVO_CAL', label: fa.creditConfig.scopeNivoCal },
              ]}
            />
          </Form.Item>
          <Space size="large" wrap>
            <Form.Item name="isPopular" label={fa.creditConfig.isPopular} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isBestValue" label={fa.creditConfig.isBestValue} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isCustomAmount" label={fa.creditConfig.isCustomAmount} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label={fa.creditConfig.active} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
