import type { Cents } from '@/domain/money'
import { digitsToCents, maskMoney } from '@/lib/money-input'
import { TextField } from './TextField'

interface MoneyFieldProps {
  label?: string
  value: Cents
  onChange: (value: Cents) => void
  placeholder?: string
  error?: string
  autoFocus?: boolean
  name?: string
}

/** Campo de valor com máscara bancária; expõe o valor em `Cents`. */
export function MoneyField({
  label = 'Valor',
  value,
  onChange,
  placeholder = '0,00',
  error,
  autoFocus,
  name = 'amount',
}: MoneyFieldProps) {
  return (
    <TextField
      label={label}
      name={name}
      inputMode="numeric"
      autoFocus={autoFocus}
      placeholder={placeholder}
      error={error}
      value={value === 0 ? '' : maskMoney(String(value))}
      onChange={(e) => onChange(digitsToCents(e.target.value))}
    />
  )
}
