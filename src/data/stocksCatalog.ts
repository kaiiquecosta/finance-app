import { FIIS_CATALOG_UNIQUE } from './catalog/fiis'
import { BR_STOCKS_CATALOG } from './catalog/brStocks'
import {
  US_STOCKS_CATALOG,
  ETFS_CATALOG,
  BDRS_CATALOG,
  CRYPTO_CATALOG,
  INDICES_CATALOG,
  COMMODITIES_CATALOG,
} from './catalog/markets'
import { normalizeSearchTicker } from './catalog/helpers'

/** Catálogo exibido na aba Investidor / Mercado (símbolos Yahoo Finance). */

export type StockRegion = 'us' | 'br' | 'global'
export type AssetKind = 'stock' | 'fii' | 'etf' | 'crypto' | 'bdr' | 'index' | 'commodity'

export interface StockDef {
  yahoo: string
  symbol: string
  name: string
  exchange: string
  region: StockRegion
  kind: AssetKind
  icon: string
  currency: 'USD' | 'BRL'
  tags?: string[]
}

export const US_STOCKS = US_STOCKS_CATALOG
export const BR_STOCKS = BR_STOCKS_CATALOG
export const BR_FIIS = FIIS_CATALOG_UNIQUE
export const ETFS = ETFS_CATALOG
export const CRYPTO_ASSETS = CRYPTO_CATALOG
export const BR_BDRS = BDRS_CATALOG
export const INDICES = INDICES_CATALOG
export const COMMODITIES = COMMODITIES_CATALOG

export const ALL_STOCKS: StockDef[] = [
  ...US_STOCKS,
  ...BR_STOCKS,
  ...BR_FIIS,
  ...BR_BDRS,
  ...ETFS,
  ...INDICES,
  ...COMMODITIES,
  ...CRYPTO_ASSETS,
]

/** Símbolos usados no watchlist principal (spark em lote). */
export const CORE_SYMBOLS: string[] = ALL_STOCKS.map((s) => s.yahoo)

export function stockByYahoo(yahoo: string): StockDef | undefined {
  return ALL_STOCKS.find((s) => s.yahoo === yahoo)
}

export function symbolsForCategory(match: (def: StockDef) => boolean): string[] {
  return ALL_STOCKS.filter(match).map((s) => s.yahoo)
}

/** Resolve um texto de busca para um símbolo Yahoo plausível. */
export function resolveSearchSymbol(input: string): string | null {
  const raw = normalizeSearchTicker(input)
  if (!raw || raw.length > 12 || !/^[A-Z0-9.\-=^]+$/.test(raw)) return null
  const direct = ALL_STOCKS.find((s) => s.symbol === raw || s.yahoo === raw)
  if (direct) return direct.yahoo
  if (/^[A-Z]{4}\d{1,2}$/.test(raw)) return `${raw}.SA`
  return raw
}

export { normalizeSearchTicker } from './catalog/helpers'
