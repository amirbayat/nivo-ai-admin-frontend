import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Dropdown, Input, InputNumber, Select, Space, Switch, Tabs, Tag, Tooltip, Typography } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { KieVideoModel } from '@/types/api'
import {
  isFieldRequired,
  isFieldVisible,
  parseInputFieldsRaw,
  type FieldCondition,
  type FieldValues,
  type InputFieldsSchema,
  type KieField,
} from '@/types/inputFieldsSchema'

const { Text } = Typography

// ─── اسنیپت‌های آماده (بخش ۴ اسپک) — هر کدام دقیقاً یک فیلد کامل و معتبر طبق KieFieldSchema،
// فقط برای شروع سریع؛ key پلیس‌هولدر با timestamp تا با فیلدهای موجود تصادم نکند.
function buildSnippets(): { id: string; label: string; build: () => KieField }[] {
  const k = () => `field_${Date.now()}`
  return [
    {
      id: 'image',
      label: 'فیلد عکس',
      build: (): KieField => ({
        key: k(),
        kieField: 'image_url',
        label: 'تصویر مرجع',
        required: false,
        order: 100,
        type: 'image',
        accept: ['image/png', 'image/jpeg'],
        maxCount: 1,
      }),
    },
    {
      id: 'video-window',
      label: 'فیلد ویدیو با پنجره‌ی برش',
      build: (): KieField => ({
        key: k(),
        kieField: 'video_list',
        label: 'ویدیوی مرجع (با برش)',
        required: false,
        order: 100,
        type: 'video',
        accept: ['video/mp4'],
        wireShape: 'objectWithWindow',
        objectWindowKeys: { url: 'url', start: 'start', end: 'end' },
        trim: { enabled: true, maxWindowSec: 8 },
      }),
    },
    {
      id: 'duration-sentinel',
      label: 'فیلد مدت با سنتینل خودکار',
      build: (): KieField => ({
        key: k(),
        kieField: 'duration',
        label: 'مدت (ثانیه)',
        required: false,
        order: 100,
        type: 'duration',
        mode: 'freeRange',
        range: { min: 1, max: 30 },
        wireValueType: 'number',
        default: 4,
        autoSentinel: { value: -1, triggerWhen: { kind: 'fieldPresent', fieldKey: 'video' } },
      }),
    },
    {
      id: 'shot-group',
      label: 'گروه شات‌ها (Kling چندشات)',
      build: (): KieField => ({
        key: k(),
        kieField: 'shots',
        label: 'شات‌ها',
        required: true,
        order: 100,
        type: 'shotGroup',
        minShots: 1,
        maxShots: 5,
        shotPromptField: { multiline: true, maxLength: 500, required: true },
        shotDurationField: { min: 2, max: 10, wireValueType: 'number' },
        wireBehavior: { itemPromptKey: 'prompt', itemDurationKey: 'duration' },
      }),
    },
    {
      id: 'element-group',
      label: 'گروه عناصر (element-lock)',
      build: (): KieField => ({
        key: k(),
        kieField: 'elements',
        label: 'عناصر ثابت (کاراکتر/شیء)',
        required: false,
        order: 100,
        type: 'elementGroup',
        minCount: 0,
        maxCount: 4,
        nameKieField: 'name',
        memberShape: { imageField: { accept: ['image/png'], maxCount: 1, minCount: 1 } },
      }),
    },
    {
      id: 'audio-toggle',
      label: 'toggle خروجی صدا',
      build: (): KieField => ({
        key: k(),
        kieField: 'generate_audio',
        label: 'تولید صدا',
        required: false,
        order: 100,
        type: 'boolean',
        default: false,
        semantic: 'audioOutputToggle',
      }),
    },
  ]
}

// شبیه‌سازی مقدار «حاضر» برای فیلدهای رسانه‌ای موک‌شده — فقط برای اینکه visibleWhen/requiredWhen
// وابسته به این فیلد در پیش‌نمایش قابل‌تست باشد، هیچ آپلود واقعی‌ای رخ نمی‌دهد
function mockPresentValue(field: KieField): unknown {
  switch (field.type) {
    case 'video':
      return { key: 'mock-video-key' }
    case 'imageArray':
    case 'audioArray':
    case 'videoArray':
      return ['mock-key']
    default:
      return 'mock-key'
  }
}

function describeCondition(cond: FieldCondition): string {
  switch (cond.kind) {
    case 'fieldPresent':
      return `«${cond.fieldKey}» پر باشد`
    case 'fieldAbsent':
      return `«${cond.fieldKey}» خالی باشد`
    case 'fieldEquals':
      return `«${cond.fieldKey}» برابر ${JSON.stringify(cond.value)} باشد`
    case 'and':
      return (cond.all ?? []).map(describeCondition).join(' و ')
    case 'or':
      return (cond.any ?? []).map(describeCondition).join(' یا ')
    default:
      return ''
  }
}

interface Section {
  id: string
  label: string | null
  fields: KieField[]
}

// گروه‌بندی طبق uiGroups (اگر باشد) — فیلدهای بدون uiGroup معتبر بالای صفحه، بدون عنوان
function buildSections(schema: InputFieldsSchema): Section[] {
  const groups = [...(schema.uiGroups ?? [])].sort((a, b) => a.order - b.order)
  const byId = new Map(groups.map(g => [g.id, g]))
  const buckets = new Map<string, KieField[]>()
  for (const f of schema.fields) {
    const gid = f.uiGroup && byId.has(f.uiGroup) ? f.uiGroup : ''
    if (!buckets.has(gid)) buckets.set(gid, [])
    buckets.get(gid)!.push(f)
  }
  for (const arr of buckets.values()) arr.sort((a, b) => a.order - b.order)
  const sections: Section[] = []
  if (buckets.has('')) sections.push({ id: '', label: null, fields: buckets.get('')! })
  for (const g of groups) {
    if (buckets.has(g.id)) sections.push({ id: g.id, label: g.label, fields: buckets.get(g.id)! })
  }
  return sections
}

function PreviewField({
  field,
  values,
  onChange,
}: {
  field: KieField
  values: FieldValues
  onChange: (key: string, value: unknown) => void
}) {
  if (!isFieldVisible(field, values)) return null
  const required = isFieldRequired(field, values)

  const conditionCaptions: string[] = []
  if (field.visibleWhen) conditionCaptions.push(`نمایش وقتی ${describeCondition(field.visibleWhen)}`)
  if (field.requiredWhen) conditionCaptions.push(`الزام وقتی ${describeCondition(field.requiredWhen)}`)
  if (field.allowedOnlyWhen) conditionCaptions.push(`فقط مجاز وقتی ${describeCondition(field.allowedOnlyWhen)}`)

  let control: React.ReactNode
  switch (field.type) {
    case 'text': {
      const val = (values[field.key] as string) ?? ''
      control = field.multiline ? (
        <Input.TextArea
          rows={2}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={val}
          onChange={e => onChange(field.key, e.target.value)}
        />
      ) : (
        <Input
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={val}
          onChange={e => onChange(field.key, e.target.value)}
        />
      )
      break
    }
    case 'boolean': {
      const val = (values[field.key] as boolean | undefined) ?? field.default
      control = <Switch checked={val} onChange={c => onChange(field.key, c)} />
      break
    }
    case 'number': {
      control = (
        <InputNumber
          style={{ width: '100%' }}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={values[field.key] as number | undefined}
          onChange={v => onChange(field.key, v)}
        />
      )
      break
    }
    case 'duration': {
      const val = (values[field.key] as number | undefined) ?? field.default
      control = (
        <InputNumber
          style={{ width: '100%' }}
          min={field.range?.min}
          max={field.range?.max}
          value={val}
          onChange={v => onChange(field.key, v)}
        />
      )
      break
    }
    case 'enum': {
      control = (
        <Select
          style={{ width: '100%' }}
          allowClear
          options={field.options}
          value={values[field.key] as string | undefined}
          onChange={v => onChange(field.key, v)}
        />
      )
      break
    }
    case 'image':
    case 'imageArray':
    case 'video':
    case 'videoArray':
    case 'audio':
    case 'audioArray': {
      const present = values[field.key] != null
      control = (
        <Space>
          <Tooltip title={`accept: ${field.accept.join('، ')}`}>
            <Button disabled icon={<UploadOutlined />}>آپلود {field.label}</Button>
          </Tooltip>
          <Tooltip title="فقط برای تست visibleWhen/requiredWhen — شبیه‌سازی حضور فایل، آپلود واقعی نیست">
            <Switch
              checkedChildren="حاضر"
              unCheckedChildren="خالی"
              checked={present}
              onChange={c => onChange(field.key, c ? mockPresentValue(field) : undefined)}
            />
          </Tooltip>
        </Space>
      )
      break
    }
    case 'elementGroup': {
      const arr = (values[field.key] as unknown[]) ?? []
      control = (
        <Space>
          <Tag>{arr.length} عنصر (حداقل {field.minCount}، حداکثر {field.maxCount})</Tag>
          <Button
            size="small"
            disabled={arr.length >= field.maxCount}
            onClick={() => onChange(field.key, [...arr, { name: `عنصر ${arr.length + 1}` }])}
          >
            افزودن
          </Button>
          {arr.length > 0 && (
            <Button size="small" onClick={() => onChange(field.key, arr.slice(0, -1))}>
              حذف آخرین
            </Button>
          )}
        </Space>
      )
      break
    }
    case 'shotGroup': {
      const arr = (values[field.key] as unknown[]) ?? []
      control = (
        <Space>
          <Tag>{arr.length} شات (حداقل {field.minShots}، حداکثر {field.maxShots})</Tag>
          <Button
            size="small"
            disabled={arr.length >= field.maxShots}
            onClick={() => onChange(field.key, [...arr, { prompt: '' }])}
          >
            افزودن
          </Button>
          {arr.length > 0 && (
            <Button size="small" onClick={() => onChange(field.key, arr.slice(0, -1))}>
              حذف آخرین
            </Button>
          )}
        </Space>
      )
      break
    }
    case 'derivedBoolean': {
      const source = values[field.derivedFromFieldKey]
      const length = Array.isArray(source) ? source.length : 0
      control = <Switch checked={length > field.threshold} disabled />
      break
    }
    default:
      control = null
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div>
        <Text strong>{field.label}</Text>
        {required && <Text type="danger"> *</Text>}
        <Text type="secondary" style={{ marginInlineStart: 8, fontSize: 12 }}>
          {field.key}
        </Text>
      </div>
      <div style={{ marginTop: 4, maxWidth: 420 }}>{control}</div>
      {field.helpText && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{field.helpText}</div>
      )}
      {conditionCaptions.length > 0 && (
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{conditionCaptions.join(' — ')}</div>
      )}
    </div>
  )
}

function SchemaPreview({ schema }: { schema: InputFieldsSchema }) {
  const [values, setValues] = useState<FieldValues>({})
  // با هر schema جدید (بعد از ویرایش JSON) پیش‌نمایش را از صفر شروع کن — کلیدهای فیلد ممکن است
  // عوض شده باشند
  useEffect(() => setValues({}), [schema])

  const sections = useMemo(() => buildSections(schema), [schema])
  const update = (key: string, value: unknown) => setValues(prev => ({ ...prev, [key]: value }))

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Text type="secondary">مقادیر پایین فقط برای تست زنده‌ی شرط‌های visibleWhen/requiredWhen است؛ ذخیره نمی‌شود.</Text>
        <Button size="small" onClick={() => setValues({})}>ریست پیش‌نمایش</Button>
      </div>
      {sections.map(section => (
        <div key={section.id || '__ungrouped__'} style={{ marginBottom: 20 }}>
          {section.label && (
            <div style={{ fontWeight: 600, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
              {section.label}
            </div>
          )}
          {section.fields.map(f => (
            <PreviewField key={f.key} field={f} values={values} onChange={update} />
          ))}
        </div>
      ))}
      {schema.exclusivityGroups && schema.exclusivityGroups.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {schema.exclusivityGroups.map(g => (
            <Tag key={g.id} color="gold">
              گروه انحصاری «{g.id}»: {g.fieldKeys.join('، ')}
              {g.atLeastOneRequired ? ' (حداقل یکی الزامی)' : ''}
              {g.atMostOne ? ' (حداکثر یکی)' : ''}
            </Tag>
          ))}
        </div>
      )}
    </div>
  )
}

function insertSnippetIntoRaw(raw: string, field: KieField): string {
  const trimmed = raw.trim()
  let doc: { version: 1; fields: KieField[]; exclusivityGroups?: unknown; uiGroups?: unknown }
  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    doc = { version: 1, fields: [] }
  } else {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      doc = {
        version: 1,
        fields: Array.isArray(parsed.fields) ? (parsed.fields as KieField[]) : [],
        exclusivityGroups: parsed.exclusivityGroups,
        uiGroups: parsed.uiGroups,
      }
    } catch {
      doc = { version: 1, fields: [] }
    }
  }
  doc.fields = [...doc.fields, field]
  return JSON.stringify(doc, null, 2)
}

export function InputFieldsEditor({
  value,
  onChange,
  models,
}: {
  value: string
  onChange: (raw: string) => void
  // فقط در حالت افزودن مدل جدید پاس داده می‌شود — بخش ۵ اسپک (کپی از مدل موجود)
  models?: KieVideoModel[]
}) {
  const [status, setStatus] = useState(() => parseInputFieldsRaw(value))
  const [cloneSourceId, setCloneSourceId] = useState<string | undefined>()

  // پارس دیبانس‌شده (~۴۰۰ms) — این نه فیلد فرم antd است نه چیزی که هر کلید باید فوری اعتبارسنجی شود
  useEffect(() => {
    const t = setTimeout(() => setStatus(parseInputFieldsRaw(value)), 400)
    return () => clearTimeout(t)
  }, [value])

  const snippets = useMemo(buildSnippets, [])
  const cloneSource = models?.find(m => m.id === cloneSourceId)
  const canClone = !!cloneSource && cloneSource.inputFields != null

  return (
    <div>
      <Space style={{ marginBottom: 8 }} wrap>
        <Dropdown
          menu={{
            items: snippets.map(s => ({ key: s.id, label: s.label })),
            onClick: ({ key }) => {
              const snippet = snippets.find(s => s.id === key)
              if (snippet) onChange(insertSnippetIntoRaw(value, snippet.build()))
            },
          }}
        >
          <Button icon={<PlusOutlined />}>افزودن اسنیپت</Button>
        </Dropdown>

        {models && (
          <>
            <Select
              showSearch
              allowClear
              placeholder="کپی از مدل دیگر..."
              style={{ minWidth: 260 }}
              value={cloneSourceId}
              onChange={setCloneSourceId}
              options={models.map(m => ({ value: m.id, label: `${m.displayName} (${m.slug})` }))}
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
            <Tooltip title={cloneSourceId && !canClone ? 'این مدل inputFields ندارد (معماری قدیمی)' : ''}>
              <Button
                disabled={!canClone}
                onClick={() => {
                  if (cloneSource?.inputFields != null) {
                    onChange(JSON.stringify(cloneSource.inputFields, null, 2))
                  }
                }}
              >
                کپی inputFields
              </Button>
            </Tooltip>
          </>
        )}
      </Space>

      <Tabs
        size="small"
        items={[
          {
            key: 'json',
            label: 'JSON',
            children: (
              <div>
                <Input.TextArea
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  rows={16}
                  style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                  placeholder='خالی = بدون تغییر (معماری قدیمی برای مدل جدید). برای پاک‌کردن صریح مقدار موجود، فقط کلمه‌ی "null" را تایپ کن.'
                />
                <div style={{ marginTop: 8 }}>
                  {status.kind === 'empty' && (
                    <Alert type="info" showIcon message="خالی — روی «ذخیره» به inputFields دست زده نمی‌شود (معماری قدیمی/بدون تغییر)." />
                  )}
                  {status.kind === 'explicitNull' && (
                    <Alert type="warning" showIcon message="مقدار «null» — روی «ذخیره»، inputFields این مدل صراحتاً به معماری قدیمی بازمی‌گردد." />
                  )}
                  {status.kind === 'invalid' && <Alert type="error" showIcon message="نامعتبر" description={status.error} />}
                  {status.kind === 'valid' && (
                    <Alert type="success" showIcon message={`✓ معتبر — ${status.data.fields.length} فیلد`} />
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'preview',
            label: 'پیش‌نمایش',
            children:
              status.kind === 'valid' ? (
                <SchemaPreview schema={status.data} />
              ) : (
                <Text type="secondary">برای پیش‌نمایش، ابتدا در تب JSON یک schema معتبر وارد کن.</Text>
              ),
          },
        ]}
      />
    </div>
  )
}
