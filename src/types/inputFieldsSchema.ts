import { z } from 'zod'

// آینه‌ی دستی nivo-ai-backend/src/modules/kie-video-models/input-fields.schema.ts — چون بین
// سه ریپو پکیج مشترکی نیست (همون الگویی که types/api.ts برای بقیه‌ی Prisma types انجام
// می‌دهد). هر تغییری در schema بک‌اند باید دستی اینجا هم اعمال شود؛ نام فیلدها عیناً با
// nivo-ai-frontend/src/types/inputFields.ts یکی نگه داشته شده.

const fieldKey = z.string().min(1)

interface FieldConditionShape {
  kind: 'fieldPresent' | 'fieldAbsent' | 'fieldEquals' | 'and' | 'or'
  fieldKey?: string
  value?: string | number | boolean
  all?: FieldConditionShape[]
  any?: FieldConditionShape[]
}

// شرط قابل‌استفاده‌ی مجدد برای visibleWhen/requiredWhen/allowedOnlyWhen/autoSentinel.triggerWhen/omitWhen
export const FieldConditionSchema: z.ZodType<FieldConditionShape> = z.lazy(() =>
  z.union([
    z.object({ kind: z.literal('fieldPresent'), fieldKey }),
    z.object({ kind: z.literal('fieldAbsent'), fieldKey }),
    z.object({
      kind: z.literal('fieldEquals'),
      fieldKey,
      value: z.union([z.string(), z.number(), z.boolean()]),
    }),
    z.object({ kind: z.literal('and'), all: z.array(FieldConditionSchema).min(1) }),
    z.object({ kind: z.literal('or'), any: z.array(FieldConditionSchema).min(1) }),
  ]),
)

const baseFieldShape = {
  key: fieldKey,
  kieField: fieldKey,
  label: z.string().min(1),
  helpText: z.string().optional(),
  required: z.boolean(),
  order: z.number(),
  uiGroup: z.string().optional(),
  visibleWhen: FieldConditionSchema.optional(),
  requiredWhen: FieldConditionSchema.optional(),
  allowedOnlyWhen: FieldConditionSchema.optional(),
  omitWhenEmpty: z.boolean().optional(),
}

const TextFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('text'),
  multiline: z.boolean(),
  maxLength: z.number().int().positive().optional(),
  placeholder: z.string().optional(),
  semantic: z.enum(['mainPrompt', 'shotPrompt', 'characterDescription', 'generic']).optional(),
})

const BooleanFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('boolean'),
  default: z.boolean(),
  semantic: z.enum(['audioOutputToggle', 'generic']).optional(),
})

const NumberFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  wireValueType: z.enum(['number', 'string']).optional(),
})

const optionSchema = z.object({ value: z.string(), label: z.string() })

const EnumFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('enum'),
  options: z.array(optionSchema).min(1),
  wireValueType: z.enum(['string', 'number']).optional(),
  semantic: z.enum(['aspectRatio', 'resolution', 'generic']).optional(),
  optionsDependOn: z
    .object({
      fieldKeys: z.array(fieldKey).min(1),
      optionsByKey: z.record(z.string(), z.array(optionSchema)),
    })
    .optional(),
})

const DurationFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('duration'),
  mode: z.enum(['fixedList', 'freeRange']),
  fixedOptions: z.array(z.number()).optional(),
  snapToNearestAllowed: z.boolean().optional(),
  range: z.object({ min: z.number(), max: z.number() }).optional(),
  wireValueType: z.enum(['number', 'string']),
  default: z.number(),
  autoSentinel: z.object({ value: z.number(), triggerWhen: FieldConditionSchema }).optional(),
  omitWhen: FieldConditionSchema.optional(),
})

const mediaBaseShape = {
  ...baseFieldShape,
  accept: z.array(z.string()).min(1),
  maxFileSizeBytes: z.number().int().positive().optional(),
  role: z.string().optional(),
}

const ImageFieldSchema = z.object({
  ...mediaBaseShape,
  type: z.enum(['image', 'imageArray']),
  maxCount: z.number().int().positive().optional(),
  minCount: z.number().int().nonnegative().optional(),
})

const objectWindowKeysSchema = z.object({ url: z.string().min(1), start: z.string().min(1), end: z.string().min(1) })

const VideoFieldSchema = z.object({
  ...mediaBaseShape,
  type: z.enum(['video', 'videoArray']),
  maxDurationSec: z.number().positive().optional(),
  wireShape: z.enum(['scalarUrl', 'arrayOfUrl', 'objectWithWindow']),
  objectWindowKeys: objectWindowKeysSchema.optional(),
  trim: z.object({ enabled: z.boolean(), maxWindowSec: z.number().positive() }).optional(),
})

const AudioFieldSchema = z.object({
  ...mediaBaseShape,
  type: z.enum(['audio', 'audioArray']),
  audioRole: z.enum(['reference', 'drivingRequired', 'drivingOptional']),
  maxDurationSec: z.number().positive().optional(),
  maxCount: z.number().int().positive().optional(),
})

const memberMediaShape = z
  .object({
    accept: z.array(z.string()).min(1),
    maxFileSizeBytes: z.number().int().positive(),
    maxDurationSec: z.number().positive(),
    minCount: z.number().int().nonnegative(),
    maxCount: z.number().int().positive(),
    wireShape: z.enum(['scalarUrl', 'arrayOfUrl', 'objectWithWindow']),
    audioRole: z.enum(['reference', 'drivingRequired', 'drivingOptional']),
  })
  .partial()

const ElementGroupFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('elementGroup'),
  minCount: z.number().int().nonnegative(),
  maxCount: z.number().int().positive(),
  nameKieField: z.string().min(1),
  memberShape: z.object({
    imageField: memberMediaShape.optional(),
    videoField: memberMediaShape.optional(),
    audioField: memberMediaShape.optional(),
  }),
})

const ShotGroupFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('shotGroup'),
  minShots: z.number().int().positive(),
  maxShots: z.number().int().positive(),
  shotPromptField: z.object({
    multiline: z.boolean().optional(),
    maxLength: z.number().int().positive().optional(),
    required: z.boolean().optional(),
  }),
  shotDurationField: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      wireValueType: z.enum(['number', 'string']).optional(),
    })
    .optional(),
  wireBehavior: z.object({
    itemPromptKey: z.string().min(1),
    itemDurationKey: z.string().min(1).optional(),
  }),
  linkedElementFieldKey: fieldKey.optional(),
})

const DerivedBooleanFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('derivedBoolean'),
  derivedFromFieldKey: fieldKey,
  predicate: z.literal('arrayLengthGreaterThan'),
  threshold: z.number(),
})

export const KieFieldSchema = z.union([
  TextFieldSchema,
  BooleanFieldSchema,
  NumberFieldSchema,
  EnumFieldSchema,
  DurationFieldSchema,
  ImageFieldSchema,
  VideoFieldSchema,
  AudioFieldSchema,
  ElementGroupFieldSchema,
  ShotGroupFieldSchema,
  DerivedBooleanFieldSchema,
])

const ExclusivityGroupSchema = z.object({
  id: z.string().min(1),
  fieldKeys: z.array(fieldKey).min(2),
  atLeastOneRequired: z.boolean(),
  atMostOne: z.boolean(),
})

const UiGroupSchema = z.object({ id: z.string().min(1), label: z.string().min(1), order: z.number() })

export const InputFieldsSchemaZod = z.object({
  version: z.literal(1),
  fields: z.array(KieFieldSchema).min(1),
  exclusivityGroups: z.array(ExclusivityGroupSchema).optional(),
  uiGroups: z.array(UiGroupSchema).optional(),
})

export type FieldCondition = FieldConditionShape
export type KieField = z.infer<typeof KieFieldSchema>
export type InputFieldsSchema = z.infer<typeof InputFieldsSchemaZod>
export type EnumOption = z.infer<typeof optionSchema>
export type ExclusivityGroup = z.infer<typeof ExclusivityGroupSchema>
export type UiGroup = z.infer<typeof UiGroupSchema>

// شکل مقداری preview/فرم — همون FieldValues بک‌اند (generic-payload-builder.ts)
export type FieldValues = Record<string, unknown>

function formatZodError(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('؛ ')
}

// نسخه‌ی غیر-throw — برای اعتبارسنجی درجا در UI (نه throw مثل نسخه‌ی بک‌اند)
export function parseInputFields(raw: unknown): { success: true; data: InputFieldsSchema } | { success: false; error: string } {
  const result = InputFieldsSchemaZod.safeParse(raw)
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) }
  }
  const keys = result.data.fields.map(f => f.key)
  const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))]
  if (dupes.length > 0) {
    return { success: false, error: `کلید(های) تکراری در fields: ${dupes.join('، ')}` }
  }
  return { success: true, data: result.data }
}

// ============================== Condition evaluation (برای پیش‌نمایش زنده) ==============================
// آینه‌ی دستی evaluateCondition در nivo-ai-backend/.../generic-payload-builder.ts — همون منطق،
// فقط برای رندر زنده‌ی پیش‌نمایش ادمین (نه validation واقعی submission).

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function evaluateCondition(condition: FieldCondition, values: FieldValues): boolean {
  switch (condition.kind) {
    case 'fieldPresent':
      return isPresent(values[condition.fieldKey!])
    case 'fieldAbsent':
      return !isPresent(values[condition.fieldKey!])
    case 'fieldEquals':
      return values[condition.fieldKey!] === condition.value
    case 'and':
      return (condition.all ?? []).every(c => evaluateCondition(c, values))
    case 'or':
      return (condition.any ?? []).some(c => evaluateCondition(c, values))
    default:
      return false
  }
}

export function isFieldVisible(field: KieField, values: FieldValues): boolean {
  return !field.visibleWhen || evaluateCondition(field.visibleWhen, values)
}

export function isFieldRequired(field: KieField, values: FieldValues): boolean {
  if (field.required) return true
  return !!field.requiredWhen && evaluateCondition(field.requiredWhen, values)
}

// ============================== Raw textarea convention ==============================
// آینه‌ی همون قرارداد cellToJsonInputFields (ایمپورت اکسل بک‌اند، kie-video-models.service.ts):
// خالی یعنی «دست نزن» (ادیت: بدون تغییر؛ مدل جدید: همچنان null/معماری قدیمی)، متن لفظی
// "null" یعنی صراحتاً پاک‌کردن به معماری قدیمی، هر چیز دیگر باید JSON معتبر طبق schema باشد.
export type InputFieldsRawStatus =
  | { kind: 'empty' }
  | { kind: 'explicitNull' }
  | { kind: 'invalid'; error: string }
  | { kind: 'valid'; data: InputFieldsSchema }

export function parseInputFieldsRaw(raw: string): InputFieldsRawStatus {
  const trimmed = raw.trim()
  if (trimmed === '') return { kind: 'empty' }
  if (trimmed.toLowerCase() === 'null') return { kind: 'explicitNull' }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    return { kind: 'invalid', error: e instanceof Error ? `JSON قابل‌پارس نیست: ${e.message}` : 'JSON قابل‌پارس نیست' }
  }
  const result = parseInputFields(parsed)
  if (!result.success) return { kind: 'invalid', error: result.error }
  return { kind: 'valid', data: result.data }
}
