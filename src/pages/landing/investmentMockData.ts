import { categoryById, type InvestorCategoryId } from '@/data/investorCategories'
import { stockByYahoo } from '@/data/stocksCatalog'

export type MockMainTab = 'carteira' | 'favoritos' | 'investidor' | 'mercado'
export type MockRanking = 'up' | 'down' | 'price' | 'vol'

export interface MockQuote {
  yahoo: string
  pct: number
  price: number
}

export interface MockCategoryBundle {
  gainers: MockQuote[]
  losers: MockQuote[]
}

const br = (yahoo: string, pct: number, price: number): MockQuote => ({ yahoo, pct, price })

export const MOCK_CATEGORY_QUOTES: Record<InvestorCategoryId, MockCategoryBundle | null> = {
  ideas: {
    gainers: [br('PETR4.SA', 1.99, 43.55), br('B3SA3.SA', 1.96, 16.05), br('VALE3.SA', 1.12, 58.9), br('ITUB4.SA', 0.88, 38.21)],
    losers: [br('MGLU3.SA', -4.55, 8.42), br('CYRE3.SA', -2.1, 15.8), br('GGBR4.SA', -1.85, 18.3), br('WEGE3.SA', -0.92, 42.1)],
  },
  favorites: {
    gainers: [br('PETR4.SA', 1.99, 43.55), br('MXRF11.SA', 0.74, 10.85)],
    losers: [br('VALE3.SA', -0.42, 58.9)],
  },
  acoes_br: {
    gainers: [br('PETR4.SA', 1.99, 43.55), br('B3SA3.SA', 1.96, 16.05), br('VALE3.SA', 1.12, 58.9), br('ITUB4.SA', 0.88, 38.21)],
    losers: [br('MGLU3.SA', -4.55, 8.42), br('CYRE3.SA', -2.1, 15.8), br('GGBR4.SA', -1.85, 18.3), br('WEGE3.SA', -0.92, 42.1)],
  },
  fiis: {
    gainers: [br('MXRF11.SA', 0.92, 10.85), br('HGLG11.SA', 0.78, 156.2), br('XPLG11.SA', 0.65, 98.4), br('KNRI11.SA', 0.41, 142.5)],
    losers: [br('VISC11.SA', -0.88, 95.2), br('KNCR11.SA', -0.62, 104.5), br('RBRR11.SA', -0.35, 88.1)],
  },
  stocks_us: {
    gainers: [br('AAPL', 2.14, 227.5), br('NVDA', 1.88, 875.2), br('MSFT', 1.02, 415.8), br('AMZN', 0.76, 178.4)],
    losers: [br('TSLA', -2.45, 248.9), br('META', -1.12, 512.3), br('NFLX', -0.88, 682.1)],
  },
  etfs_br: {
    gainers: [br('BOVA11.SA', 0.82, 128.4), br('IVVB11.SA', 0.65, 312.5), br('SMAL11.SA', 0.48, 98.2), br('DIVO11.SA', 0.31, 54.8)],
    losers: [br('HASH11.SA', -1.15, 52.3), br('GOLD11.SA', -0.42, 14.8)],
  },
  etfs_us: {
    gainers: [br('QQQ', 1.45, 482.3), br('SPY', 0.92, 548.2), br('VOO', 0.88, 512.4), br('IWM', 0.55, 218.6)],
    losers: [br('DIA', -0.32, 398.5), br('VTI', -0.18, 278.2)],
  },
  bdrs: {
    gainers: [br('AAPL34.SA', 1.25, 68.4), br('MSFT34.SA', 0.92, 52.1), br('AMZO34.SA', 0.55, 44.8)],
    losers: [br('TSLA34.SA', -1.85, 38.2), br('NVDC34.SA', -0.72, 41.5)],
  },
  crypto: {
    gainers: [br('BTC-USD', 3.12, 68250), br('ETH-USD', 2.45, 3420), br('SOL-USD', 1.88, 142.5)],
    losers: [br('DOGE-USD', -2.1, 0.12), br('ADA-USD', -1.05, 0.45)],
  },
  indices: {
    gainers: [br('^BVSP', 0.85, 128420), br('^GSPC', 0.62, 5480), br('^IXIC', 0.78, 17820)],
    losers: [br('^VIX', -4.2, 14.8)],
  },
  commodities: {
    gainers: [br('GC=F', 0.55, 2340), br('CL=F', 0.42, 78.5)],
    losers: [br('SI=F', -0.88, 28.4)],
  },
  renda_fixa: null,
  tesouro: null,
}

export const MOCK_LIVE_INDICES = [
  { icon: '🇧🇷', label: 'Ibovespa', value: '128.420', pct: 0.85 },
  { icon: '🇺🇸', label: 'S&P 500', value: '5.480', pct: 0.62 },
  { icon: '💵', label: 'Dólar', value: 'R$ 5,42', pct: -0.18 },
  { icon: '📊', label: 'CDI (aa)', value: '13,65%', pct: 0 },
]

export const RAIL_GROUPS: Array<{
  label: string
  items: Array<{ id: InvestorCategoryId; short: string }>
}> = [
  {
    label: 'Brasil · B3',
    items: [
      { id: 'acoes_br', short: '🇧🇷 Ações BR' },
      { id: 'fiis', short: '🏢 FIIs' },
      { id: 'bdrs', short: '🌎 BDRs' },
      { id: 'etfs_br', short: '🧺 ETFs BR' },
    ],
  },
  {
    label: 'Internacional',
    items: [
      { id: 'stocks_us', short: '🇺🇸 Ações US' },
      { id: 'etfs_us', short: '🦅 ETFs US' },
    ],
  },
  {
    label: 'Global',
    items: [
      { id: 'crypto', short: '₿ Cripto' },
      { id: 'indices', short: '📊 Índices' },
    ],
  },
  {
    label: 'Renda fixa',
    items: [
      { id: 'renda_fixa', short: '📈 Renda fixa' },
      { id: 'tesouro', short: '🏛 Tesouro' },
    ],
  },
]

export function formatMockPrice(yahoo: string, price: number): string {
  const def = stockByYahoo(yahoo)
  const currency = def?.currency ?? (yahoo.endsWith('.SA') ? 'BRL' : 'USD')
  if (currency === 'BRL') {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function formatMockPct(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2).replace('.', ',')}%`
}

export function categoryMeta(id: InvestorCategoryId) {
  return categoryById(id)
}
