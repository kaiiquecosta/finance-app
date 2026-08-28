import { useId, useState } from 'react'
import { TextField } from '@/components/ui/TextField'

type Props = {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  currency: 'BRL' | 'USD'
  placeholder?: string
  disabled?: boolean
}

function formatPrice(value: number | null, currency: 'BRL' | 'USD'): string {
  if (value == null || !Number.isFinite(value)) return ''
  const locale = currency === 'USD' ? 'en-US' : 'pt-BR'
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.trim().replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!cleaned || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function UnitPriceField({
  label,
  value,
  onChange,
  currency,
  placeholder = '0,00',
  disabled,
}: Props) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const prefix = currency === 'USD' ? 'US$' : 'R$'
  const display = draft ?? formatPrice(value, currency)

  return (
    <TextField
      label={label}
      name={id}
      inputMode="decimal"
      prefix={prefix}
      placeholder={placeholder}
      value={display}
      disabled={disabled}
      onChange={(e) => {
        setDraft(e.target.value)
        const parsed = parsePrice(e.target.value)
        onChange(parsed)
      }}
      onBlur={() => setDraft(null)}
    />
  )
}
