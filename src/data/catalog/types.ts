/** Tipos do catálogo de ativos (sem dependência circular). */

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
