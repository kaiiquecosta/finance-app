import { useCallback, useId, useState } from 'react'
import styles from './QuantityStepper.module.css'

type Props = {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  decimals?: number
  disabled?: boolean
  ariaLabel?: string
}

function clampQty(value: number, min: number, decimals: number): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return Math.max(min, rounded)
}

function formatQty(value: number, decimals: number): string {
  if (decimals <= 0) return String(Math.round(value))
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

function parseQty(raw: string, decimals: number): number | null {
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.')
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return null
  return clampQty(n, 0, decimals)
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  step = 1,
  decimals = 0,
  disabled,
  ariaLabel = 'Quantidade',
}: Props) {
  const inputId = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const display = draft ?? formatQty(value, decimals)

  const commit = useCallback(
    (next: number) => {
      setDraft(null)
      onChange(clampQty(next, min, decimals))
    },
    [decimals, min, onChange],
  )

  return (
    <div className={styles.wrap} aria-label={ariaLabel}>
      <button
        type="button"
        className={styles.btn}
        disabled={disabled || value <= min}
        onClick={() => commit(value - step)}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <input
        id={inputId}
        className={styles.input}
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        value={display}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft == null) return
          const parsed = parseQty(draft, decimals)
          if (parsed != null) commit(parsed)
          else setDraft(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      <button
        type="button"
        className={styles.btn}
        disabled={disabled}
        onClick={() => commit(value + step)}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  )
}
