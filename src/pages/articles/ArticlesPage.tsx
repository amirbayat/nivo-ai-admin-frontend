import { useState } from 'react'
import {
  Alert, Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message,
} from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  useArticleCategories, useArticles, useCreateArticle, useDeleteArticle, useUpdateArticle,
} from '@/queries/articles.queries'
import { env } from '@/env'
import type { Article, ArticleInput, ArticleStatus } from '@/types/api'

const { Title } = Typography
const { TextArea } = Input

// دامنه‌ی اصلی سایت (نه API) — /blog از این دامنه (پشت nginx/Vite proxy) reachable است،
// نه از زیردامنه‌ی api.* که فقط برای درخواست‌های JSON استفاده می‌شود
const BLOG_ORIGIN = env.VITE_PUBLIC_SITE_URL

const STATUS_OPTIONS: { value: ArticleStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'پیش‌نویس', color: 'default' },
  { value: 'PUBLISHED', label: 'منتشرشده', color: 'green' },
]

interface ArticleFormValues extends ArticleInput {
  status: ArticleStatus
}

export function ArticlesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form] = Form.useForm<ArticleFormValues>()

  const { data: articles, isLoading } = useArticles()
  const { data: categories } = useArticleCategories()
  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle()
  const deleteArticle = useDeleteArticle()

  function openAdd() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 'DRAFT', isPinnedInBanner: false })
    setOpen(true)
  }

  function openEdit(article: Article) {
    setEditing(article)
    form.setFieldsValue({
      title: article.title,
      slug: article.slug,
      metaDescription: article.metaDescription ?? undefined,
      coverImageUrl: article.coverImageUrl ?? undefined,
      contentMd: article.contentMd,
      categoryId: article.categoryId ?? undefined,
      status: article.status,
      isPinnedInBanner: article.isPinnedInBanner,
    })
    setOpen(true)
  }

  function handleSave() {
    form.validateFields().then((values) => {
      const mutation = editing
        ? updateArticle.mutateAsync({ id: editing.id, data: values })
        : createArticle.mutateAsync(values)
      mutation.then(
        () => {
          void message.success('ذخیره شد')
          setOpen(false)
        },
        () => void message.error('ذخیره نشد، دوباره امتحان کن'),
      )
    })
  }

  const columns: ColumnsType<Article> = [
    { title: 'عنوان', dataIndex: 'title', key: 'title' },
    {
      title: 'لینک داخلی', dataIndex: 'slug', key: 'slug',
      render: (slug: string) => (
        <Space>
          <Typography.Text code copyable={{ text: `/blog/${slug}` }} style={{ direction: 'ltr' }}>
            /blog/{slug}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'دسته', key: 'category',
      render: (_, a) => a.category?.name ?? '—',
    },
    {
      title: 'وضعیت', dataIndex: 'status', key: 'status', width: 110,
      render: (v: ArticleStatus) => {
        const s = STATUS_OPTIONS.find((o) => o.value === v)!
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: 'در ردیف تبلیغاتی', dataIndex: 'isPinnedInBanner', key: 'isPinnedInBanner', width: 130,
      render: (v: boolean) => (v ? <Tag color="gold">فعال</Tag> : '—'),
    },
    {
      title: 'تاریخ انتشار', dataIndex: 'publishedAt', key: 'publishedAt', width: 140,
      render: (v: string | null) => (v ? new Date(v).toLocaleDateString('fa-IR') : '—'),
    },
    {
      title: 'عملیات', key: 'actions', width: 220,
      render: (_, article) => (
        <Space>
          {article.status === 'PUBLISHED' && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              href={`${BLOG_ORIGIN}/blog/${article.slug}`}
              target="_blank"
            >
              مشاهده
            </Button>
          )}
          <Button size="small" onClick={() => openEdit(article)}>ویرایش</Button>
          <Popconfirm title="این مقاله حذف شود؟" onConfirm={() => deleteArticle.mutate(article.id)}>
            <Button size="small" danger>حذف</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>مقالات</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>افزودن مقاله</Button>
      </div>

      <Table<Article>
        rowKey="id"
        dataSource={articles ?? []}
        columns={columns}
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        confirmLoading={createArticle.isPending || updateArticle.isPending}
        okText="ذخیره"
        cancelText="انصراف"
        title={editing ? 'ویرایش مقاله' : 'افزودن مقاله'}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="عنوان" rules={[{ required: true }]}>
            <Input placeholder="هوش مصنوعی به چه دردی می‌خوره؟" />
          </Form.Item>
          <Form.Item name="slug" label="slug (اختیاری — اگر خالی بماند از عنوان ساخته می‌شود)">
            <Input style={{ direction: 'ltr' }} />
          </Form.Item>
          <Form.Item name="categoryId" label="دسته‌بندی">
            <Select
              allowClear
              placeholder="انتخاب دسته‌بندی"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="metaDescription" label="توضیح متا (برای SEO — اختیاری، اگر خالی بماند از ابتدای متن ساخته می‌شود)">
            <TextArea rows={2} maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="آدرس تصویر کاور (اختیاری)">
            <Input placeholder="https://..." style={{ direction: 'ltr' }} />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="لینک‌دهی داخلی درست"
            description={
              <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                <li>لینک به مقاله‌ی دیگر: <code>[متن لینک](/blog/اسلاگ-مقاله)</code> — اسلاگ‌ها را از ستون «لینک داخلی» در جدول کپی کن</li>
                <li>لینک به ثبت‌نام/شروع رایگان: <code>[متن لینک](/login)</code></li>
                <li>لینک به بخش قیمت‌ها در صفحه‌ی اصلی: <code>[متن لینک](/#pricing)</code></li>
                <li>
                  <b>به /pricing یا /models لینک نده</b> — این دو صفحه فقط برای کاربر واردشده کار می‌کنند؛ خواننده‌ی
                  ناشناس مقاله را مستقیم به صفحه‌ی ورود می‌فرستند
                </li>
              </ul>
            }
          />
          <Form.Item
            name="contentMd"
            label="محتوا (Markdown)"
            rules={[{ required: true }]}
            extra="Markdown خام را همین‌جا پیست کن — دقیقاً همون‌طور که در صفحه‌ی مقاله رندر می‌شود. تگ HTML خام (مثل اسکیمای FAQ) هم بدون تغییر رندر می‌شود."
          >
            <TextArea rows={14} style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }} />
          </Form.Item>
          <Form.Item name="status" label="وضعیت" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Form.Item>
          <Form.Item
            name="isPinnedInBanner"
            label="نمایش در ردیف تبلیغاتی لندینگ"
            valuePropName="checked"
            extra="فقط یک مقاله می‌تواند همزمان فعال باشد — فعال‌کردنش برای این مقاله، بقیه را خودکار خاموش می‌کند."
          >
            <Switch />
          </Form.Item>
          {editing?.status === 'DRAFT' && (
            <Alert type="info" showIcon message="این مقاله هنوز پیش‌نویس است و در /blog دیده نمی‌شود." />
          )}
        </Form>
      </Modal>
    </div>
  )
}
