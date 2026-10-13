const PERSIAN_ZERO = 0x06f0
const ARABIC_ZERO = 0x0660

/** تبدیل ارقام فارسی (۰-۹) و عربی (٠-٩) به انگلیسی. */
export function toEnglishDigits(value: string): string {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, (ch) => {
    const code = ch.charCodeAt(0)
    return String(code >= PERSIAN_ZERO + 0 && code <= PERSIAN_ZERO + 9 ? code - PERSIAN_ZERO : code - ARABIC_ZERO)
  })
}

/** ارقام را انگلیسی می‌کند، جداکننده‌های هزارگان (, ٬ ، و فاصله) را حذف و '٫' را به '.' تبدیل می‌کند. */
export function normalizeNumericString(value: string): string {
  return toEnglishDigits(value)
    .replace(/[,٬،\s‌‏‎]/g, '')
    .replace(/٫/g, '.')
}
