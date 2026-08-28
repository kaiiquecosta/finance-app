import { useState } from 'react'
import { assetLogoFallbacks, assetLogoUrl } from '@/data/assetLogos'
import { LIGHT_MODE_MONO_LOGOS } from '@/data/assetLogoMono'
import { stockByYahoo, type StockDef } from '@/data/stocksCatalog'
import styles from './AssetMark.module.css'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  def?: Pick<StockDef, 'symbol' | 'kind' | 'region' | 'icon' | 'yahoo'>
  yahoo?: string
  symbol?: string
  fallbackIcon?: string
  size?: Size
  className?: string
  alt?: string
}

export function AssetMark({ def, yahoo, symbol, fallbackIcon = '📈', size = 'md', className, alt }: Props) {
  const resolved = def ?? (yahoo ? stockByYahoo(yahoo) : undefined)
  const sym = resolved?.symbol ?? symbol ?? '?'
  const icon = resolved?.icon ?? fallbackIcon
  const logoInput = resolved
    ? { symbol: resolved.symbol, kind: resolved.kind, region: resolved.region }
    : null

  const [srcIndex, setSrcIndex] = useState(0)
  const urls = logoInput
    ? [assetLogoUrl(logoInput), ...assetLogoFallbacks(logoInput)].filter(Boolean) as string[]
    : []
  const src = urls[srcIndex]

  const onError = () => {
    if (srcIndex < urls.length - 1) setSrcIndex((i) => i + 1)
    else setSrcIndex(urls.length)
  }

  const showImg = src && srcIndex < urls.length
  const monoLight = LIGHT_MODE_MONO_LOGOS.has(sym.toUpperCase())

  return (
    <span
      className={[styles.mark, styles[size], monoLight ? styles.monoLight : '', className].filter(Boolean).join(' ')}
      aria-hidden={!alt}
      title={alt ?? sym}
    >
      {showImg ? (
        <img src={src} alt={alt ?? sym} className={styles.img} loading="lazy" onError={onError} />
      ) : (
        <span className={styles.emoji}>{icon}</span>
      )}
    </span>
  )
}
