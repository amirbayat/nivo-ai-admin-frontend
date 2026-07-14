import { useEffect, useState } from 'react'
import { Card, Segmented, Select, InputNumber, Button, Typography, Space, message, Spin, Popconfirm, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { usePlans, useModels, usePlanRouting, useUpdatePlanRouting } from '@/queries/admin.queries'
import type { RoutingStep } from '@/types/api'
import { SortableModelItem } from './SortableModelItem'

const { Title, Text } = Typography

const STEP_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function StepModelsEditor({
  models,
  options,
  onChange,
}: {
  models: string[]
  options: { value: string; label: string }[]
  onChange: (models: string[]) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = models.indexOf(String(active.id))
      const newIndex = models.indexOf(String(over.id))
      onChange(arrayMove(models, oldIndex, newIndex))
    }
  }

  const remainingOptions = options.filter((o) => !models.includes(o.value))
  const labelOf = (name: string) => options.find((o) => o.value === name)?.label ?? name

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={models} strategy={verticalListSortingStrategy}>
          <Space direction="vertical" style={{ width: '100%' }} size={6}>
            {models.map((m) => (
              <SortableModelItem
                key={m}
                id={m}
                label={labelOf(m)}
                onRemove={() => onChange(models.filter((x) => x !== m))}
              />
            ))}
          </Space>
        </SortableContext>
      </DndContext>

      {!models.length && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          هنوز مدلی به این استپ اضافه نشده
        </Text>
      )}

      {remainingOptions.length > 0 && (
        <Select
          key={models.join(',')}
          showSearch
          placeholder="+ افزودن مدل به این استپ"
          style={{ width: '100%', marginTop: 8 }}
          options={remainingOptions}
          optionFilterProp="label"
          onSelect={(value: string) => onChange([...models, value])}
        />
      )}
    </div>
  )
}

function StepsCoverageBar({ steps }: { steps: RoutingStep[] }) {
  if (!steps.length) return null
  let prev = 0
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', border: '1px solid #333' }}>
        {steps.map((s, i) => {
          const width = Math.max(0, s.thresholdPct - prev)
          prev = s.thresholdPct
          return (
            <div
              key={i}
              style={{ width: `${width}%`, background: STEP_COLORS[i % STEP_COLORS.length] }}
              title={`استپ ${i + 1}: تا ${s.thresholdPct}٪`}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>۰٪</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>۱۰۰٪ (و بیشتر)</Text>
      </div>
    </div>
  )
}

export function ModelRoutingPage() {
  const { data: plans, isLoading: plansLoading } = usePlans()
  const { data: allModels } = useModels()
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (!selectedPlanId && plans?.length) setSelectedPlanId(plans[0].id)
  }, [plans, selectedPlanId])

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId)
  const { data: routing, isLoading: routingLoading } = usePlanRouting(selectedPlanId)
  const updateRouting = useUpdatePlanRouting()

  const [simpleModel, setSimpleModel] = useState<string | null>(null)
  const [steps, setSteps] = useState<RoutingStep[]>([])

  useEffect(() => {
    if (routing) {
      setSimpleModel(routing.simpleModel)
      setSteps(routing.steps)
    } else {
      setSimpleModel(null)
      setSteps([])
    }
  }, [routing])

  if (plansLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  const modelOptions = (allModels ?? [])
    .filter((m) => selectedPlan?.allowedModels.includes(m.name))
    .map((m) => ({ value: m.name, label: `${m.displayName} (${m.name})` }))

  function updateStep(index: number, patch: Partial<RoutingStep>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })))
  }

  function addStep() {
    const lastPct = steps.length ? steps[steps.length - 1].thresholdPct : 0
    setSteps((prev) => [...prev, { order: prev.length + 1, thresholdPct: Math.min(100, lastPct + 10), models: [] }])
  }

  function handleSave() {
    if (!selectedPlanId) return
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].thresholdPct <= steps[i - 1].thresholdPct) {
        void messageApi.error('سقف مصرف استپ‌ها باید صعودی باشد')
        return
      }
    }
    updateRouting.mutate(
      { planId: selectedPlanId, data: { simpleModel, steps } },
      {
        onSuccess: () => void messageApi.success('ذخیره شد'),
        onError: () => void messageApi.error('خطا در ذخیره‌سازی'),
      },
    )
  }

  return (
    <div>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>مسیریابی مدل‌ها</Title>
        <Button type="primary" icon={<SaveOutlined />} loading={updateRouting.isPending} onClick={handleSave}>
          ذخیره
        </Button>
      </div>

      <Segmented
        value={selectedPlanId}
        onChange={(v) => setSelectedPlanId(v as string)}
        options={(plans ?? []).map((p) => ({ value: p.id, label: p.name }))}
        style={{ marginBottom: 20 }}
      />

      {routingLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : !selectedPlan ? (
        <Empty description="پلنی انتخاب نشده" />
      ) : (
        <>
          <Card title="مدل ساده (SIMPLE)" size="small" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              مدلی که همیشه برای پیام‌های ساده‌ی این پلن استفاده می‌شود — فارغ از استپ بودجه‌ای فعلی
            </Text>
            <Select
              allowClear
              style={{ width: '100%', maxWidth: 400 }}
              placeholder="پیش‌فرض سیستم (ارزان‌ترین مدل مجاز)"
              value={simpleModel ?? undefined}
              options={modelOptions}
              optionFilterProp="label"
              showSearch
              onChange={(v) => setSimpleModel(v ?? null)}
            />
          </Card>

          <Card
            title="استپ‌های بودجه‌ای (MEDIUM/COMPLEX)"
            size="small"
            extra={<Button icon={<PlusOutlined />} size="small" onClick={addStep}>افزودن استپ</Button>}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
              با بالا رفتن درصد مصرف بودجه‌ی روزانه، مدل انتخابی از استخر همان استپ می‌آید (هم بر اساس سختی پیام، هم ترتیب لیست).
            </Text>

            <StepsCoverageBar steps={steps} />

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {steps.map((step, i) => (
                <Card
                  key={i}
                  size="small"
                  style={{ borderInlineStart: `3px solid ${STEP_COLORS[i % STEP_COLORS.length]}` }}
                  title={`استپ ${i + 1}`}
                  extra={
                    <Popconfirm title="این استپ حذف شود؟" onConfirm={() => removeStep(i)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  }
                >
                  <Space align="center" style={{ marginBottom: 12 }} wrap>
                    <Text>سقف مصرف روزانه تا:</Text>
                    <InputNumber
                      min={1}
                      max={999}
                      value={step.thresholdPct}
                      onChange={(v) => updateStep(i, { thresholdPct: v ?? step.thresholdPct })}
                      addonAfter="٪"
                    />
                    <Text style={{ marginInlineStart: 12 }}>میزان reasoning این استپ:</Text>
                    <Select
                      allowClear
                      style={{ width: 160 }}
                      placeholder="پیش‌فرض پلن"
                      value={step.reasoningEffort ?? undefined}
                      onChange={(v) => updateStep(i, { reasoningEffort: v ?? null })}
                      options={[
                        { value: 'minimal', label: 'حداقل' },
                        { value: 'low', label: 'کم' },
                        { value: 'medium', label: 'متوسط' },
                        { value: 'high', label: 'بالا' },
                      ]}
                    />
                  </Space>
                  <StepModelsEditor
                    models={step.models}
                    options={modelOptions}
                    onChange={(models) => updateStep(i, { models })}
                  />
                </Card>
              ))}
            </Space>

            {!steps.length && (
              <Empty description="این پلن هنوز استپی ندارد — رفتار فعلی (بدون درجه‌بندی بودجه‌ای) اعمال می‌شود" />
            )}
          </Card>
        </>
      )}
    </div>
  )
}
