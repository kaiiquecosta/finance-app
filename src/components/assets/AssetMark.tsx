import { useEffect, useMemo, useState } from 'react'
import { assetLogoCandidates, assetLogoDarkTile } from '@/data/assetLogos'
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

  const urls = useMemo(
    () => (logoInput ? assetLogoCandidates(logoInput) : []),
    [logoInput?.symbol, logoInput?.kind, logoInput?.region],
  )
  const urlsKey = urls.join('|')

  const [srcIndex, setSrcIndex] = useState(0)

  useEffect(() => {
    setSrcIndex(0)
  }, [sym, urlsKey])

  const advance = () => {
    setSrcIndex((i) => (i < urls.length - 1 ? i + 1 : urls.length))
  }

  const src = urls[srcIndex]
  const showImg = src != null && srcIndex < urls.length
  const monoLight = LIGHT_MODE_MONO_LOGOS.has(sym.toUpperCase())
  const darkTile = assetLogoDarkTile(sym)

  return (
    <span
      className={[
        styles.mark,
        styles[size],
        monoLight ? styles.monoLight : '',
        darkTile ? styles.darkTile : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!alt}
      title={alt ?? sym}
    >
      {showImg ? (
        <img
          src={src}
          alt={alt ?? sym}
          className={styles.img}
          loading="lazy"
          onError={advance}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth < 2 || img.naturalHeight < 2) advance()
          }}
        />
      ) : (
        <span className={styles.emoji}>{icon}</span>
      )}
    </span>
  )
}
