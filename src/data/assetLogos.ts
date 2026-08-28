/**
 * URLs de logo de ativos (mesmo estilo visual do Investidor10 / B3).
 * BR ações/BDRs → brapi · FIIs/ETFs B3 → icones-b3 · EUA → CMC → FMP · cripto → spothq.
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
const CMC_BASE = 'https://companiesmarketcap.com/img/company-logos/64'

/** Aliases para CDNs que usam ticker diferente (ex.: GOOGL → GOOG). */
const LOGO_SYMBOL_ALIASES: Record<string, string> = {
  GOOGL: 'GOOG',
}

/** Logos brancos sobre fundo escuro (FMP) — tile escuro no modo claro. */
const DARK_TILE_SYMBOLS = new Set(['DIS', 'V'])

function logoSymbol(symbol: string): string {
  const sym = symbol.toUpperCase()
  return LOGO_SYMBOL_ALIASES[sym] ?? sym
}

function cmcLogoUrl(symbol: string): string {
  return `${CMC_BASE}/${encodeURIComponent(logoSymbol(symbol))}.webp`
}

function fmpLogoUrl(symbol: string): string {
  return `${US_STOCK_BASE}/${encodeURIComponent(symbol.toUpperCase())}.png`
}

function brapiLogoUrl(symbol: string): string {
  return `${BRAPI_BASE}/${encodeURIComponent(symbol.toUpperCase())}.svg`
}

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
      return brapiLogoUrl(sym)
    }
    return null
  }

  if (input.region === 'us' && (input.kind === 'stock' || input.kind === 'etf')) {
    return cmcLogoUrl(sym)
  }

  return null
}

/** Lista de URLs alternativas na ordem de tentativa. */
export function assetLogoFallbacks(input: AssetLogoInput): string[] {
  const sym = input.symbol.toUpperCase()
  const primary = assetLogoUrl(input)
  const fallbacks: string[] = []

  if (input.region === 'br' && (input.kind === 'stock' || input.kind === 'bdr')) {
    fallbacks.push(`${FINTZ_BASE}/${sym}.png`)
  }
  if (input.region === 'us' && (input.kind === 'stock' || input.kind === 'etf')) {
    fallbacks.push(fmpLogoUrl(sym), brapiLogoUrl(sym))
  }

  return fallbacks.filter((url) => url !== primary)
}

/** Todas as URLs em ordem (primária + fallbacks), sem duplicatas. */
export function assetLogoCandidates(input: AssetLogoInput): string[] {
  const primary = assetLogoUrl(input)
  if (!primary) return []
  return [primary, ...assetLogoFallbacks(input)]
}

/** Tile escuro no modo claro — logos brancos (Disney, Visa…) ficam visíveis no fallback FMP. */
export function assetLogoDarkTile(symbol: string): boolean {
  return DARK_TILE_SYMBOLS.has(symbol.toUpperCase())
}
