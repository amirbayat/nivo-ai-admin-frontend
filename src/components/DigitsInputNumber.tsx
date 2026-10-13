import { forwardRef } from 'react'
import type { ComponentRef } from 'react'
import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'
import { normalizeNumericString } from '@/lib/digits'

type Props = InputNumberProps<number>
type Ref = ComponentRef<typeof InputNumber>

/**
 * جایگزین drop-in برای InputNumber آنت‌دیزاین که ارقام فارسی/عربی را
 * (تایپ یا paste) پیش از parse به انگلیسی تبدیل می‌کند.
 */
const DigitsInputNumber = forwardRef<Ref, Props>(function DigitsInputNumber(
  { parser, inputMode, ...rest },
  ref,
) {
  const composedParser = (displayValue: string | undefined) => {
    const normalized = normalizeNumericString(displayValue ?? '')
    return (parser ? parser(normalized) : normalized) as unknown as number
  }
  return (
    <InputNumber
      {...rest}
      ref={ref}
      parser={composedParser}
      inputMode={inputMode ?? (rest.precision === 0 ? 'numeric' : 'decimal')}
    />
  )
})

export default DigitsInputNumber
