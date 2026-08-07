import { bankButtonTextColor, type BankPreset } from '@/domain/banks'
import styles from './BankMark.module.css'

interface Props {
  preset: Pick<BankPreset, 'mark' | 'color'>
  size?: 'xs' | 'sm' | 'md'
  /** `onBrand`: monograma claro sobre chip já colorido. */
  variant?: 'solid' | 'onBrand'
  className?: string
}

/** Marca visual do banco (monograma sobre fundo da cor da marca). */
export function BankMark({ preset, size = 'md', variant = 'solid', className }: Props) {
  const fg = bankButtonTextColor(preset.color)
  const style =
    variant === 'onBrand'
      ? {
          background: 'color-mix(in srgb, #fff 22%, transparent)',
          color: '#fff',
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, #fff 35%, transparent)',
        }
      : { background: preset.color, color: fg }
  const sizeClass = size === 'xs' ? styles.xs : size === 'sm' ? styles.sm : styles.md
  return (
    <span
      className={[styles.mark, sizeClass, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden
    >
      {preset.mark}
    </span>
  )
}
