#!/bin/sh
# گارد ارقام فارسی: InputNumber مستقیم و type="number" ممنوع است (از DigitsInputNumber / DigitsInput استفاده کنید).
cd "$(dirname "$0")/.." || exit 1
fail=0
tmp=$(mktemp)

# 1) واردکردن InputNumber از antd (تک‌خطی یا چندخطی) بیرون از wrapper
find src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path 'src/components/DigitsInputNumber.tsx' | while read -r f; do
  awk -v F="$f" '
    /import[^;]*\{/ && !/\}/ { inimp=1 }
    inimp && /InputNumber/ { print F ":" NR ": import of InputNumber from antd is forbidden, use DigitsInputNumber"; }
    /from .antd./ { if ($0 ~ /InputNumber/ && !inimp) print F ":" NR ": import of InputNumber from antd is forbidden, use DigitsInputNumber" }
    /\}/ { inimp=0 }
  ' "$f"
done > "$tmp"

# 2) type="number" بیرون از wrapperها
grep -rnE "type=(\"number\"|'number'|\{['\"]number['\"]\})" src \
  --exclude=DigitsInput.tsx --exclude=DigitsInputNumber.tsx >> "$tmp"

if [ -s "$tmp" ]; then
  cat "$tmp"
  fail=1
fi
rm -f "$tmp"
exit $fail
