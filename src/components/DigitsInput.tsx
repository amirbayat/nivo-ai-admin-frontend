import { forwardRef } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import { normalizeNumericString, toEnglishDigits } from '@/lib/digits'

export type DigitsKind = 'phone' | 'otp' | 'int' | 'decimal'

interface Props extends Omit<InputProps, 'type'> {
  kind: DigitsKind
}

const INPUT_MODE: Record<DigitsKind, 'tel' | 'numeric' | 'decimal'> = {
  phone: 'tel',
  otp: 'numeric',
  int: 'numeric',
  decimal: 'decimal',
}

/** ورودی متنی (type=text) برای شماره/کد/عدد که ارقام فارسی را هنگام تایپ و paste به انگلیسی تبدیل می‌کند. */
const DigitsInput = forwardRef<InputRef, Props>(function DigitsInput({ kind, onChange, autoComplete, ...rest }, ref) {
  return (
    <Input
      dir="ltr"
      {...rest}
      ref={ref}
      type="text"
      inputMode={INPUT_MODE[kind]}
      autoComplete={autoComplete ?? (kind === 'otp' ? 'one-time-code' : kind === 'phone' ? 'tel' : undefined)}
      onChange={(e) => {
        const raw = e.target.value
        e.target.value =
          kind === 'phone' || kind === 'otp' ? toEnglishDigits(raw).replace(/[\s-]/g, '') : normalizeNumericString(raw)
        onChange?.(e)
      }}
    />
  )
})

export default DigitsInput
