/**
 * URLs de logo de ativos (mesmo estilo visual do Investidor10 / B3).
 * BR ações/BDRs → brapi · FIIs/ETFs B3 → icones-b3 · EUA → FMP · cripto → spothq.
 */
import type { AssetKind, StockRegion } from './catalog/types'

export interface AssetLogoInput {
  symbol: string
  kind: AssetKind
  region: StockRegion
}

const FINTZ_BASE = 'https://raw.githubusercontent.com/thefintz/icones-b3/main/icones'
const BRAPI_BASE = 'https://icons.brapi.dev/icons'
const CRYPTO_BASE = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color'
const US_STOCK_BASE = 'https://financialmodelingprep.com/image-stock'

/** URL da logo ou null quando só emoji faz sentido (índice, commodity). */
export function assetLogoUrl(input: AssetLogoInput): string | null {
  const sym = input.symbol.toUpperCase()

  if (input.kind === 'crypto') {
    return `${CRYPTO_BASE}/${sym.toLowerCase()}.png`
  }

  if (input.region === 'br') {
    if (input.kind === 'fii' || input.kind === 'etf') {
      return `${FINTZ_BASE}/${sym}.png`
    }
    if (input.kind === 'stock' || input.kind === 'bdr') {
      return `${BRAPI_BASE}/${sym}.svg`
    }
    return null
  }

  if (input.region === 'us' && (input.kind === 'stock' || input.kind === 'etf')) {
    // brapi primeiro quando existir (SVG transparente, sem caixa branca)
    return `${BRAPI_BASE}/${sym}.svg`
  }

  return null
}

/** Lista de URLs alternativas (ex.: brapi falhou → icones-b3). */
export function assetLogoFallbacks(input: AssetLogoInput): string[] {
  const sym = input.symbol.toUpperCase()
  const primary = assetLogoUrl(input)
  const fallbacks: string[] = []

  if (input.region === 'br' && (input.kind === 'stock' || input.kind === 'bdr')) {
    fallbacks.push(`${FINTZ_BASE}/${sym}.png`)
  }
  if (input.region === 'us' && (input.kind === 'stock' || input.kind === 'etf')) {
    fallbacks.push(`${US_STOCK_BASE}/${sym}.png`)
  }

  return fallbacks.filter((url) => url !== primary)
}
