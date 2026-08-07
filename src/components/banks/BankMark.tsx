import { useState } from 'react'
import { bankButtonTextColor, bankLogoUrl, type BankPreset } from '@/domain/banks'
import styles from './BankMark.module.css'

interface Props {
  preset: Pick<BankPreset, 'mark' | 'color' | 'domain' | 'logoUrl' | 'name'>
  size?: 'xs' | 'sm' | 'md'
  /** `onBrand`: monograma claro sobre chip já colorido. */
  variant?: 'solid' | 'onBrand'
  className?: string
}

/** Marca visual do banco (logo da marca ou monograma sobre a cor). */
export function BankMark({ preset, size = 'md', variant = 'solid', className }: Props) {
  const [logoFailed, setLogoFailed] = useState(false)
  const logoSrc = bankLogoUrl(preset)
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
  const showLogo = logoSrc && !logoFailed && variant === 'solid'

  return (
    <span
      className={[styles.mark, sizeClass, showLogo ? styles.markLogo : '', className]
        .filter(Boolean)
        .join(' ')}
      style={showLogo ? { background: '#fff' } : style}
      aria-hidden
    >
      {showLogo ? (
        <img
          src={logoSrc}
          alt=""
          className={styles.logoImg}
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        preset.mark
      )}
    </span>
  )
}
