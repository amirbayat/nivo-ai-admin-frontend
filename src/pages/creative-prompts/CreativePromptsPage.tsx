import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  TreeSelect,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Typography,
  Upload,
  Tabs,
  Badge,
  Card,
  Empty,
  Spin,
  message,
} from 'antd'
import { PlusOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { CreativePrompt, CreativePromptSubmission } from '@/types/api'
import { useCreativeCategories } from '@/queries/creative-categories.queries'
import {
  useCreativePrompts,
  useCreateCreativePrompt,
  useUpdateCreativePrompt,
  useDeleteCreativePrompt,
  useUploadExampleImage,
  usePendingCreativePromptSubmissions,
  usePendingSubmissionsCount,
  useApproveCreativePromptSubmission,
  useRejectCreativePromptSubmission,
} from '@/queries/creative-prompts.queries'
import { useAuthedImage } from '@/hooks/useAuthedImage'
import { fa } from '@/locales/fa'

const { Title, Text } = Typography
const { TextArea } = Input

type TabKey = 'catalog' | 'submissions'

// پیام خطای فارسی که سرور موقع تایید (approve) برمی‌گرداند اگر categoryId یا
// exampleImageUrl هنوز ست نشده باشد — با همان الگوی نمایش پیام‌های antd (messageApi.error)
function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const msg = data?.message
    if (Array.isArray(msg)) return msg.join('، ')
    if (typeof msg === 'string') return msg
  }
  return fallback
}

interface PromptFormValues {
  title: string
  outputType: 'IMAGE' | 'TEXT'
  categoryId?: string
  description?: string
  contextMd: string
  userPromptTemplate: string
  exampleImageUrl?: string
  aspectRatio?: string
  requiresUserImage: boolean
  creditCost: number
  preferredModel?: string
  isTrending: boolean
  isActive: boolean
  sortOrder: number
  tagsText: string
}

export function CreativePromptsPage() {
  const [form] = Form.useForm<PromptFormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CreativePrompt | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('catalog')
  const [messageApi, contextHolder] = message.useMessage()

  const { data: prompts, isLoading } = useCreativePrompts()
  const { data: categories } = useCreativeCategories()
  const createPrompt = useCreateCreativePrompt()
  const updatePrompt = useUpdateCreativePrompt()
  const deletePrompt = useDeleteCreativePrompt()
  const uploadExampleImage = useUploadExampleImage()

  const { data: submissions, isLoading: submissionsLoading } = usePendingCreativePromptSubmissions()
  const { data: pendingCount } = usePendingSubmissionsCount()
  const approveSubmission = useApproveCreativePromptSubmission()
  const rejectSubmission = useRejectCreativePromptSubmission()

  const outputTypeWatched: 'IMAGE' | 'TEXT' | undefined = Form.useWatch('outputType', form)
  const exampleImageUrlWatched: string | undefined = Form.useWatch('exampleImageUrl', form)

  // فایل انتخاب‌شده را به data URL تبدیل می‌کند و مستقیم به AdminCreativeService.uploadExampleImage
  // می‌فرستد (همون مسیر/اعتبارسنجی آپلود عکس چت/دیسکاوری) — false یعنی antd خودش آپلود نکند
  function handleUploadExampleImage(file: File): boolean {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      uploadExampleImage.mutate(dataUrl, {
        onSuccess: ({ url }) => {
          form.setFieldsValue({ exampleImageUrl: url })
          void messageApi.success(fa.creativePrompts.uploadExampleImageSuccess)
        },
        onError: () => void messageApi.error(fa.creativePrompts.uploadExampleImageError),
      })
    }
    reader.readAsDataURL(file)
    return false
  }

  interface CategoryTreeOption {
    key: string
    value: string
    title: string
    children: CategoryTreeOption[]
  }

  function buildCategoryOptions(parentId: string | null): CategoryTreeOption[] {
    return (categories ?? [])
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({ key: c.id, value: c.id, title: c.name, children: buildCategoryOptions(c.id) }))
  }

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      outputType: 'TEXT',
      requiresUserImage: false,
      creditCost: 1,
      isTrending: false,
      isActive: true,
      sortOrder: prompts?.length ?? 0,
      tagsText: '',
    })
    setOpen(true)
  }

  function openEdit(prompt: CreativePrompt) {
    setEditing(prompt)
    form.setFieldsValue({
      title: prompt.title,
      outputType: prompt.outputType,
      categoryId: prompt.categoryId ?? undefined,
      description: prompt.description ?? undefined,
      contextMd: prompt.contextMd,
      userPromptTemplate: prompt.userPromptTemplate,
      exampleImageUrl: prompt.exampleImageUrl ?? undefined,
      aspectRatio: prompt.aspectRatio ?? undefined,
      requiresUserImage: prompt.requiresUserImage,
      creditCost: prompt.creditCost,
      preferredModel: prompt.preferredModel ?? undefined,
      isTrending: prompt.isTrending,
      isActive: prompt.isActive,
      sortOrder: prompt.sortOrder,
      tagsText: (prompt.tags ?? []).join('، '),
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then(values => {
      const { tagsText, ...rest } = values
      const data = {
        ...rest,
        categoryId: rest.categoryId ?? null,
        description: rest.description ?? null,
        exampleImageUrl: rest.exampleImageUrl ?? null,
        aspectRatio: rest.aspectRatio ?? null,
        preferredModel: rest.preferredModel ?? null,
        tags: tagsText
          .split(/[،,]/)
          .map(t => t.trim())
          .filter(Boolean),
      }
      const onSuccess = () => {
        void messageApi.success(fa.creativePrompts.saved)
        setOpen(false)
      }
      const onError = () => void messageApi.error(fa.common.error)

      if (editing) {
        updatePrompt.mutate({ id: editing.id, data }, { onSuccess, onError })
      } else {
        createPrompt.mutate(data, { onSuccess, onError })
      }
    })
  }

  function handleDelete(id: string) {
    deletePrompt.mutate(id, {
      onSuccess: () => void messageApi.success(fa.creativePrompts.deleted),
      onError: () => void messageApi.error(fa.common.error),
    })
  }

  function handleApprove(id: string) {
    approveSubmission.mutate(id, {
      onSuccess: () => void messageApi.success(fa.creativePrompts.approveSuccess),
      // سرور اگر categoryId/exampleImageUrl هنوز ست نشده باشد ۴۰۰ با پیام فارسی برمی‌گرداند —
      // همان پیام را مستقیم نشان می‌دهیم تا ادمین بداند اول باید ویرایش کند
      onError: err => void messageApi.error(extractErrorMessage(err, fa.common.error)),
    })
  }

  function handleReject(id: string) {
    rejectSubmission.mutate(id, {
      onSuccess: () => void messageApi.success(fa.creativePrompts.rejectSuccess),
      onError: err => void messageApi.error(extractErrorMessage(err, fa.common.error)),
    })
  }

  const columns: ColumnsType<CreativePrompt> = [
    {
      title: fa.creativePrompts.title,
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {r.description && <span style={{ fontSize: 12, color: '#888' }}>{r.description}</span>}
        </Space>
      ),
    },
    {
      title: fa.creativePrompts.outputType,
      dataIndex: 'outputType',
      key: 'outputType',
      width: 100,
      render: (v: string) => (
        <Tag color={v === 'IMAGE' ? 'geekblue' : 'green'}>
          {v === 'IMAGE' ? fa.creativePrompts.outputTypeImage : fa.creativePrompts.outputTypeText}
        </Tag>
      ),
    },
    {
      title: fa.creativePrompts.category,
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 160,
      render: (v: string | null) => categories?.find(c => c.id === v)?.name ?? '—',
    },
    {
      title: fa.creativePrompts.creditCost,
      dataIndex: 'creditCost',
      key: 'creditCost',
      width: 90,
      render: (v: number) => `${v.toLocaleString('fa-IR')} نیوو`,
    },
    {
      title: 'برچسب‌ها',
      key: 'badges',
      width: 180,
      render: (_, r) => (
        <Space size={4}>
          {r.isTrending && <Tag color="volcano">{fa.creativePrompts.trending}</Tag>}
          {r.requiresUserImage && <Tag color="purple">{fa.creativePrompts.requiresUserImage}</Tag>}
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
          <Button size="small" onClick={() => openEdit(record)}>ویرایش</Button>
          <Popconfirm title={fa.creativePrompts.deleteConfirm} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger loading={deletePrompt.isPending}>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{fa.creativePrompts.title2}</Title>
        {activeTab === 'catalog' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            {fa.creativePrompts.addPrompt}
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as TabKey)}
        items={[
          { key: 'catalog', label: fa.creativePrompts.tabCatalog },
          {
            key: 'submissions',
            label: (
              <Badge count={pendingCount ?? 0} size="small" offset={[8, 0]}>
                <span>{fa.creativePrompts.tabSubmissions}</span>
              </Badge>
            ),
          },
        ]}
        style={{ marginBottom: 16 }}
      />

      {activeTab === 'catalog' ? (
        <Table<CreativePrompt>
          rowKey="id"
          dataSource={prompts ?? []}
          columns={columns}
          loading={isLoading}
          locale={{ emptyText: fa.common.noData }}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <SubmissionsList
          submissions={submissions ?? []}
          isLoading={submissionsLoading}
          categories={categories}
          onEdit={openEdit}
          onApprove={handleApprove}
          onReject={handleReject}
          approvingId={approveSubmission.isPending ? approveSubmission.variables : undefined}
          rejectingId={rejectSubmission.isPending ? rejectSubmission.variables : undefined}
        />
      )}

      <Modal
        open={open}
        title={editing ? fa.creativePrompts.editPrompt : fa.creativePrompts.addPrompt}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        okText={fa.common.save}
        cancelText={fa.common.cancel}
        confirmLoading={createPrompt.isPending || updatePrompt.isPending}
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label={fa.creativePrompts.title} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="outputType" label={fa.creativePrompts.outputType} rules={[{ required: true }]} style={{ width: 200 }}>
              <Select
                options={[
                  { value: 'TEXT', label: fa.creativePrompts.outputTypeText },
                  { value: 'IMAGE', label: fa.creativePrompts.outputTypeImage },
                ]}
              />
            </Form.Item>
            <Form.Item name="categoryId" label={fa.creativePrompts.category} style={{ width: 260 }}>
              <TreeSelect
                treeData={buildCategoryOptions(null)}
                allowClear
                placeholder={fa.creativePrompts.categoryPlaceholder}
                treeDefaultExpandAll
              />
            </Form.Item>
          </Space>
          <Form.Item name="description" label={fa.creativePrompts.description}>
            <Input />
          </Form.Item>
          <Form.Item
            name="contextMd"
            label={fa.creativePrompts.contextMd}
            rules={[{ required: true }]}
            extra={fa.creativePrompts.contextMdHint}
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="userPromptTemplate"
            label={fa.creativePrompts.userPromptTemplate}
            rules={[{ required: true }]}
            extra={fa.creativePrompts.userPromptTemplateHint}
          >
            <TextArea rows={3} />
          </Form.Item>
          {outputTypeWatched === 'IMAGE' && (
            <>
              <Space size="large" align="start" style={{ width: '100%' }}>
                <Form.Item
                  name="exampleImageUrl"
                  label={fa.creativePrompts.exampleImageUrl}
                  extra={fa.creativePrompts.uploadExampleImageHint}
                  style={{ width: 300 }}
                >
                  <Input dir="ltr" placeholder="https://..." />
                </Form.Item>
                <Form.Item label=" " style={{ width: 150 }}>
                  <Upload
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    showUploadList={false}
                    beforeUpload={handleUploadExampleImage}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadExampleImage.isPending}>
                      {fa.creativePrompts.uploadExampleImage}
                    </Button>
                  </Upload>
                </Form.Item>
                <Form.Item name="aspectRatio" label={fa.creativePrompts.aspectRatio} style={{ width: 140 }}>
                  <Input dir="ltr" placeholder="1024x1024" />
                </Form.Item>
                <Form.Item name="requiresUserImage" label={fa.creativePrompts.requiresUserImage} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Space>
              {exampleImageUrlWatched && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={exampleImageUrlWatched}
                    alt=""
                    style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8, border: '1px solid #eee', objectFit: 'cover' }}
                  />
                </div>
              )}
            </>
          )}
          <Space size="large" wrap style={{ width: '100%' }}>
            <Form.Item name="creditCost" label={fa.creativePrompts.creditCost} rules={[{ required: true }]}>
              <InputNumber style={{ width: 160 }} min={0} />
            </Form.Item>
            <Form.Item name="preferredModel" label={fa.creativePrompts.preferredModel}>
              <Input dir="ltr" style={{ width: 200 }} placeholder="اختیاری" />
            </Form.Item>
            <Form.Item name="sortOrder" label={fa.creditConfig.sortOrder}>
              <InputNumber style={{ width: 120 }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="tagsText" label={fa.creativePrompts.tags} extra={fa.creativePrompts.tagsHint}>
            <Input />
          </Form.Item>
          <Space size="large">
            <Form.Item name="isTrending" label={fa.creativePrompts.trending} valuePropName="checked">
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

interface SubmissionsListProps {
  submissions: CreativePromptSubmission[]
  isLoading: boolean
  categories: { id: string; name: string }[] | undefined
  onEdit: (prompt: CreativePrompt) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  approvingId: string | undefined
  rejectingId: string | undefined
}

// لیست پیشنهادهای در انتظار بررسی (sourceType=USER_EXTRACTED, reviewStatus=PENDING) — به‌جای
// جدول از کارت استفاده می‌کند چون هر ردیف عکس اصلی کاربر (نیازمند فچ authed جدا) هم دارد
function SubmissionsList({
  submissions,
  isLoading,
  categories,
  onEdit,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}: SubmissionsListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }

  if (submissions.length === 0) {
    return <Empty description={fa.creativePrompts.submissionsEmpty} style={{ padding: 48 }} />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {submissions.map(submission => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          categoryName={categories?.find(c => c.id === submission.categoryId)?.name}
          onEdit={() => onEdit(submission)}
          onApprove={() => onApprove(submission.id)}
          onReject={() => onReject(submission.id)}
          approving={approvingId === submission.id}
          rejecting={rejectingId === submission.id}
        />
      ))}
    </Space>
  )
}

interface SubmissionCardProps {
  submission: CreativePromptSubmission
  categoryName: string | undefined
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
  approving: boolean
  rejecting: boolean
}

function SubmissionCard({
  submission,
  categoryName,
  onEdit,
  onApprove,
  onReject,
  approving,
  rejecting,
}: SubmissionCardProps) {
  // عکس اصلی کاربر پشت گارد ادمین است (نه یک URL عمومی مثل exampleImageUrl) — پس با
  // useAuthedImage (axios + blob + object URL) گرفته می‌شود، نه با src مستقیم
  const { objectUrl: sourcePhotoUrl, isLoading: sourcePhotoLoading, isError: sourcePhotoError } = useAuthedImage(
    `/admin/creative/prompts/${submission.id}/source-image`,
  )

  const submitterLabel = submission.submittedBy
    ? submission.submittedBy.name || submission.submittedBy.phone
    : fa.creativePrompts.submittedByUnknown

  return (
    <Card size="small">
      <Space size={16} align="start" style={{ width: '100%' }} wrap>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 8,
            border: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#fafafa',
          }}
          title={fa.creativePrompts.originalPhoto}
        >
          {sourcePhotoLoading && <Spin size="small" />}
          {!sourcePhotoLoading && sourcePhotoError && (
            <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', padding: 4 }}>
              {fa.creativePrompts.originalPhotoLoadError}
            </Text>
          )}
          {!sourcePhotoLoading && !sourcePhotoError && sourcePhotoUrl && (
            <img
              src={sourcePhotoUrl}
              alt={fa.creativePrompts.originalPhoto}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 200 }}>
          <Space size={8} wrap>
            <Text strong>{submission.title}</Text>
            <Tag color="purple" icon={<UserOutlined />}>
              {fa.creativePrompts.submittedBy}: {submitterLabel}
            </Tag>
          </Space>
          <Space size={16} wrap>
            <Text type="secondary">
              {fa.creativePrompts.category}: {categoryName ?? '—'}
            </Text>
            <Text type="secondary">
              {fa.creativePrompts.creditCost}: {submission.creditCost.toLocaleString('fa-IR')} نیوو
            </Text>
          </Space>
          {submission.exampleImageUrl && (
            <img
              src={submission.exampleImageUrl}
              alt=""
              style={{ maxWidth: 80, maxHeight: 80, borderRadius: 6, objectFit: 'cover', marginTop: 4 }}
            />
          )}
        </Space>

        <Space direction="vertical" size={8}>
          <Button size="small" onClick={onEdit}>
            {fa.creativePrompts.editPrompt}
          </Button>
          <Popconfirm title={fa.creativePrompts.approveConfirm} onConfirm={onApprove}>
            <Button size="small" type="primary" loading={approving} block>
              {fa.creativePrompts.approve}
            </Button>
          </Popconfirm>
          <Popconfirm title={fa.creativePrompts.rejectConfirm} onConfirm={onReject}>
            <Button size="small" danger loading={rejecting} block>
              {fa.creativePrompts.reject}
            </Button>
          </Popconfirm>
        </Space>
      </Space>
    </Card>
  )
}
