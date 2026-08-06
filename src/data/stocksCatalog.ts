/** Catálogo exibido na aba Investidor / Mercado (símbolos Yahoo Finance). */

export type StockRegion = 'us' | 'br'

export interface StockDef {
  yahoo: string
  symbol: string
  name: string
  exchange: string
  region: StockRegion
  icon: string
  currency: 'USD' | 'BRL'
  tags?: string[]
}

/** EUA — nomes mais comentados / tech. */
export const US_STOCKS: StockDef[] = [
  { yahoo: 'AAPL', symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ', region: 'us', icon: '🍎', currency: 'USD', tags: ['tech'] },
  { yahoo: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', region: 'us', icon: '💚', currency: 'USD', tags: ['tech'] },
  { yahoo: 'MSFT', symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', region: 'us', icon: '🪟', currency: 'USD', tags: ['tech'] },
  { yahoo: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', exchange: 'NASDAQ', region: 'us', icon: '🔍', currency: 'USD', tags: ['tech'] },
  { yahoo: 'META', symbol: 'META', name: 'Meta', exchange: 'NASDAQ', region: 'us', icon: '👤', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AMZN', symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', region: 'us', icon: '📦', currency: 'USD', tags: ['tech'] },
  { yahoo: 'TSLA', symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', region: 'us', icon: '⚡', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AMD', symbol: 'AMD', name: 'AMD', exchange: 'NASDAQ', region: 'us', icon: '🔥', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AVGO', symbol: 'AVGO', name: 'Broadcom', exchange: 'NASDAQ', region: 'us', icon: '📡', currency: 'USD', tags: ['tech'] },
  { yahoo: 'NFLX', symbol: 'NFLX', name: 'Netflix', exchange: 'NASDAQ', region: 'us', icon: '🎬', currency: 'USD', tags: ['tech'] },
  { yahoo: 'COIN', symbol: 'COIN', name: 'Coinbase', exchange: 'NASDAQ', region: 'us', icon: '₿', currency: 'USD', tags: ['crypto'] },
  { yahoo: 'PLTR', symbol: 'PLTR', name: 'Palantir', exchange: 'NYSE', region: 'us', icon: '🛰️', currency: 'USD', tags: ['tech'] },
  { yahoo: 'SMCI', symbol: 'SMCI', name: 'Super Micro', exchange: 'NASDAQ', region: 'us', icon: '🖥️', currency: 'USD', tags: ['tech'] },
  { yahoo: 'BRK-B', symbol: 'BRK-B', name: 'Berkshire', exchange: 'NYSE', region: 'us', icon: '🏛️', currency: 'USD' },
]

export const BR_STOCKS: StockDef[] = [
  { yahoo: 'PETR4.SA', symbol: 'PETR4', name: 'Petrobras PN', exchange: 'B3', region: 'br', icon: '🛢️', currency: 'BRL' },
  { yahoo: 'VALE3.SA', symbol: 'VALE3', name: 'Vale ON', exchange: 'B3', region: 'br', icon: '⛏️', currency: 'BRL' },
  { yahoo: 'ITUB4.SA', symbol: 'ITUB4', name: 'Itaú PN', exchange: 'B3', region: 'br', icon: '🏦', currency: 'BRL' },
  { yahoo: 'BBDC4.SA', symbol: 'BBDC4', name: 'Bradesco PN', exchange: 'B3', region: 'br', icon: '🏦', currency: 'BRL' },
  { yahoo: 'BBAS3.SA', symbol: 'BBAS3', name: 'Banco do Brasil', exchange: 'B3', region: 'br', icon: '🇧🇷', currency: 'BRL' },
  { yahoo: 'WEGE3.SA', symbol: 'WEGE3', name: 'WEG ON', exchange: 'B3', region: 'br', icon: '⚙️', currency: 'BRL' },
  { yahoo: 'ABEV3.SA', symbol: 'ABEV3', name: 'Ambev ON', exchange: 'B3', region: 'br', icon: '🍺', currency: 'BRL' },
  { yahoo: 'B3SA3.SA', symbol: 'B3SA3', name: 'B3 SA', exchange: 'B3', region: 'br', icon: '📊', currency: 'BRL' },
  { yahoo: 'MGLU3.SA', symbol: 'MGLU3', name: 'Magazine Luiza', exchange: 'B3', region: 'br', icon: '🛍️', currency: 'BRL' },
  { yahoo: 'RENT3.SA', symbol: 'RENT3', name: 'Localiza', exchange: 'B3', region: 'br', icon: '🚗', currency: 'BRL' },
]

export const ALL_STOCKS: StockDef[] = [...US_STOCKS, ...BR_STOCKS]

export function stockByYahoo(yahoo: string): StockDef | undefined {
  return ALL_STOCKS.find((s) => s.yahoo === yahoo)
}
