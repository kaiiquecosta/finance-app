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

/** EUA — nomes mais comentados / tech. */
export const US_STOCKS: StockDef[] = [
  { yahoo: 'AAPL', symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🍎', currency: 'USD', tags: ['tech'] },
  { yahoo: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '💚', currency: 'USD', tags: ['tech'] },
  { yahoo: 'MSFT', symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🪟', currency: 'USD', tags: ['tech'] },
  { yahoo: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🔍', currency: 'USD', tags: ['tech'] },
  { yahoo: 'META', symbol: 'META', name: 'Meta', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '👤', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AMZN', symbol: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '📦', currency: 'USD', tags: ['tech'] },
  { yahoo: 'TSLA', symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '⚡', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AMD', symbol: 'AMD', name: 'AMD', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🔥', currency: 'USD', tags: ['tech'] },
  { yahoo: 'AVGO', symbol: 'AVGO', name: 'Broadcom', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '📡', currency: 'USD', tags: ['tech'] },
  { yahoo: 'NFLX', symbol: 'NFLX', name: 'Netflix', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🎬', currency: 'USD', tags: ['tech'] },
  { yahoo: 'COIN', symbol: 'COIN', name: 'Coinbase', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '₿', currency: 'USD', tags: ['tech'] },
  { yahoo: 'PLTR', symbol: 'PLTR', name: 'Palantir', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🛰️', currency: 'USD', tags: ['tech'] },
  { yahoo: 'SMCI', symbol: 'SMCI', name: 'Super Micro', exchange: 'NASDAQ', region: 'us', kind: 'stock', icon: '🖥️', currency: 'USD', tags: ['tech'] },
  { yahoo: 'BRK-B', symbol: 'BRK-B', name: 'Berkshire', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🏛️', currency: 'USD', tags: ['financeiro'] },
  { yahoo: 'JPM', symbol: 'JPM', name: 'JPMorgan', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🏦', currency: 'USD', tags: ['financeiro'] },
  { yahoo: 'V', symbol: 'V', name: 'Visa', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '💳', currency: 'USD', tags: ['financeiro'] },
  { yahoo: 'DIS', symbol: 'DIS', name: 'Disney', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🏰', currency: 'USD' },
  { yahoo: 'MCD', symbol: 'MCD', name: "McDonald's", exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🍟', currency: 'USD' },
  { yahoo: 'XOM', symbol: 'XOM', name: 'ExxonMobil', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '⛽', currency: 'USD', tags: ['energia'] },
  { yahoo: 'WMT', symbol: 'WMT', name: 'Walmart', exchange: 'NYSE', region: 'us', kind: 'stock', icon: '🛒', currency: 'USD' },
]

export const BR_STOCKS: StockDef[] = [
  { yahoo: 'PETR4.SA', symbol: 'PETR4', name: 'Petrobras PN', exchange: 'B3', region: 'br', kind: 'stock', icon: '🛢️', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'VALE3.SA', symbol: 'VALE3', name: 'Vale ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '⛏️', currency: 'BRL', tags: ['materiais'] },
  { yahoo: 'ITUB4.SA', symbol: 'ITUB4', name: 'Itaú PN', exchange: 'B3', region: 'br', kind: 'stock', icon: '🏦', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'BBDC4.SA', symbol: 'BBDC4', name: 'Bradesco PN', exchange: 'B3', region: 'br', kind: 'stock', icon: '🏦', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'BBAS3.SA', symbol: 'BBAS3', name: 'Banco do Brasil', exchange: 'B3', region: 'br', kind: 'stock', icon: '🇧🇷', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'BPAC11.SA', symbol: 'BPAC11', name: 'BTG Pactual', exchange: 'B3', region: 'br', kind: 'stock', icon: '🏦', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'WEGE3.SA', symbol: 'WEGE3', name: 'WEG ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '⚙️', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'ABEV3.SA', symbol: 'ABEV3', name: 'Ambev ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '🍺', currency: 'BRL' },
  { yahoo: 'B3SA3.SA', symbol: 'B3SA3', name: 'B3 SA', exchange: 'B3', region: 'br', kind: 'stock', icon: '📊', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'MGLU3.SA', symbol: 'MGLU3', name: 'Magazine Luiza', exchange: 'B3', region: 'br', kind: 'stock', icon: '🛍️', currency: 'BRL' },
  { yahoo: 'RENT3.SA', symbol: 'RENT3', name: 'Localiza', exchange: 'B3', region: 'br', kind: 'stock', icon: '🚗', currency: 'BRL' },
  { yahoo: 'PRIO3.SA', symbol: 'PRIO3', name: 'PRIO ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '🛢️', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'RADL3.SA', symbol: 'RADL3', name: 'Raia Drogasil', exchange: 'B3', region: 'br', kind: 'stock', icon: '💊', currency: 'BRL', tags: ['saude'] },
  { yahoo: 'SUZB3.SA', symbol: 'SUZB3', name: 'Suzano ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '🌲', currency: 'BRL', tags: ['materiais'] },
  { yahoo: 'EMBR3.SA', symbol: 'EMBR3', name: 'Embraer ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '✈️', currency: 'BRL' },
  { yahoo: 'ITSA4.SA', symbol: 'ITSA4', name: 'Itaúsa PN', exchange: 'B3', region: 'br', kind: 'stock', icon: '🏛️', currency: 'BRL', tags: ['financeiro'] },
  { yahoo: 'GGBR4.SA', symbol: 'GGBR4', name: 'Gerdau PN', exchange: 'B3', region: 'br', kind: 'stock', icon: '🔩', currency: 'BRL', tags: ['materiais'] },
  { yahoo: 'AXIA3.SA', symbol: 'AXIA3', name: 'Axia Energia', exchange: 'B3', region: 'br', kind: 'stock', icon: '⚡', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'VIVT3.SA', symbol: 'VIVT3', name: 'Telefônica BR', exchange: 'B3', region: 'br', kind: 'stock', icon: '📡', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'CSAN3.SA', symbol: 'CSAN3', name: 'Cosan ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '⛽', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'TAEE11.SA', symbol: 'TAEE11', name: 'Taesa', exchange: 'B3', region: 'br', kind: 'stock', icon: '🔌', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'EQTL3.SA', symbol: 'EQTL3', name: 'Equatorial ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '💡', currency: 'BRL', tags: ['energia'] },
  { yahoo: 'HAPV3.SA', symbol: 'HAPV3', name: 'Hapvida ON', exchange: 'B3', region: 'br', kind: 'stock', icon: '🏥', currency: 'BRL', tags: ['saude'] },
]

export const BR_FIIS: StockDef[] = [
  { yahoo: 'MXRF11.SA', symbol: 'MXRF11', name: 'Maxi Renda', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏢', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'HGLG11.SA', symbol: 'HGLG11', name: 'CSHG Logística', exchange: 'B3', region: 'br', kind: 'fii', icon: '📦', currency: 'BRL', tags: ['logistico'] },
  { yahoo: 'KNRI11.SA', symbol: 'KNRI11', name: 'Kinea Renda', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏢', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'XPML11.SA', symbol: 'XPML11', name: 'XP Malls', exchange: 'B3', region: 'br', kind: 'fii', icon: '🛍️', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'VISC11.SA', symbol: 'VISC11', name: 'Vinci Shopping', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏬', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'BTLG11.SA', symbol: 'BTLG11', name: 'BTG Logística', exchange: 'B3', region: 'br', kind: 'fii', icon: '🚚', currency: 'BRL', tags: ['logistico'] },
  { yahoo: 'HGRE11.SA', symbol: 'HGRE11', name: 'CSHG Real Estate', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏙️', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'KNCR11.SA', symbol: 'KNCR11', name: 'Kinea Rendimentos', exchange: 'B3', region: 'br', kind: 'fii', icon: '📄', currency: 'BRL', tags: ['papel'] },
  { yahoo: 'BRCO11.SA', symbol: 'BRCO11', name: 'Bresco Logística', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏭', currency: 'BRL', tags: ['logistico'] },
  { yahoo: 'HGRU11.SA', symbol: 'HGRU11', name: 'CSHG Renda Urbana', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏢', currency: 'BRL', tags: ['tijolo'] },
  { yahoo: 'VRTA11.SA', symbol: 'VRTA11', name: 'Fator Verita', exchange: 'B3', region: 'br', kind: 'fii', icon: '🏢', currency: 'BRL', tags: ['hibrido'] },
  { yahoo: 'XPLG11.SA', symbol: 'XPLG11', name: 'XP Log', exchange: 'B3', region: 'br', kind: 'fii', icon: '🚛', currency: 'BRL', tags: ['logistico'] },
]

export const BR_BDRS: StockDef[] = [
  { yahoo: 'AAPL34.SA', symbol: 'AAPL34', name: 'Apple BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '🍎', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'MSFT34.SA', symbol: 'MSFT34', name: 'Microsoft BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '🪟', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'NVDC34.SA', symbol: 'NVDC34', name: 'NVIDIA BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '💚', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'AMZO34.SA', symbol: 'AMZO34', name: 'Amazon BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '📦', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'GOGL34.SA', symbol: 'GOGL34', name: 'Alphabet BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '🔍', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'TSLA34.SA', symbol: 'TSLA34', name: 'Tesla BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '⚡', currency: 'BRL', tags: ['tech'] },
  { yahoo: 'DISB34.SA', symbol: 'DISB34', name: 'Disney BDR', exchange: 'B3', region: 'br', kind: 'bdr', icon: '🏰', currency: 'BRL' },
]

export const ETFS: StockDef[] = [
  { yahoo: 'BOVA11.SA', symbol: 'BOVA11', name: 'iShares Ibovespa', exchange: 'B3', region: 'br', kind: 'etf', icon: '📊', currency: 'BRL' },
  { yahoo: 'IVVB11.SA', symbol: 'IVVB11', name: 'iShares S&P 500', exchange: 'B3', region: 'br', kind: 'etf', icon: '🇺🇸', currency: 'BRL' },
  { yahoo: 'SMAL11.SA', symbol: 'SMAL11', name: 'iShares Small Caps', exchange: 'B3', region: 'br', kind: 'etf', icon: '🔬', currency: 'BRL' },
  { yahoo: 'DIVO11.SA', symbol: 'DIVO11', name: 'IT Now IDIV', exchange: 'B3', region: 'br', kind: 'etf', icon: '💰', currency: 'BRL' },
  { yahoo: 'GOLD11.SA', symbol: 'GOLD11', name: 'ETF Ouro', exchange: 'B3', region: 'br', kind: 'etf', icon: '🥇', currency: 'BRL' },
  { yahoo: 'SPY', symbol: 'SPY', name: 'SPDR S&P 500', exchange: 'NYSE', region: 'us', kind: 'etf', icon: '🦅', currency: 'USD' },
  { yahoo: 'QQQ', symbol: 'QQQ', name: 'Invesco Nasdaq 100', exchange: 'NASDAQ', region: 'us', kind: 'etf', icon: '💻', currency: 'USD' },
  { yahoo: 'VOO', symbol: 'VOO', name: 'Vanguard S&P 500', exchange: 'NYSE', region: 'us', kind: 'etf', icon: '🧭', currency: 'USD' },
  { yahoo: 'IWM', symbol: 'IWM', name: 'Russell 2000', exchange: 'NYSE', region: 'us', kind: 'etf', icon: '📈', currency: 'USD' },
]

export const INDICES: StockDef[] = [
  { yahoo: '^BVSP', symbol: 'IBOV', name: 'Ibovespa', exchange: 'Brasil', region: 'br', kind: 'index', icon: '🇧🇷', currency: 'BRL' },
  { yahoo: '^GSPC', symbol: 'S&P 500', name: 'S&P 500', exchange: 'EUA', region: 'us', kind: 'index', icon: '🇺🇸', currency: 'USD' },
  { yahoo: '^IXIC', symbol: 'NASDAQ', name: 'Nasdaq Composite', exchange: 'EUA', region: 'us', kind: 'index', icon: '💻', currency: 'USD' },
  { yahoo: '^DJI', symbol: 'DOW', name: 'Dow Jones', exchange: 'EUA', region: 'us', kind: 'index', icon: '📊', currency: 'USD' },
  { yahoo: '^RUT', symbol: 'RUT', name: 'Russell 2000', exchange: 'EUA', region: 'us', kind: 'index', icon: '🔬', currency: 'USD' },
  { yahoo: '^VIX', symbol: 'VIX', name: 'Índice de volatilidade', exchange: 'CBOE', region: 'us', kind: 'index', icon: '🌪️', currency: 'USD' },
]

export const COMMODITIES: StockDef[] = [
  { yahoo: 'GC=F', symbol: 'OURO', name: 'Ouro', exchange: 'Futuros', region: 'global', kind: 'commodity', icon: '🥇', currency: 'USD' },
  { yahoo: 'CL=F', symbol: 'WTI', name: 'Petróleo WTI', exchange: 'Futuros', region: 'global', kind: 'commodity', icon: '🛢️', currency: 'USD' },
  { yahoo: 'BZ=F', symbol: 'BRENT', name: 'Petróleo Brent', exchange: 'Futuros', region: 'global', kind: 'commodity', icon: '⛽', currency: 'USD' },
  { yahoo: 'SI=F', symbol: 'PRATA', name: 'Prata', exchange: 'Futuros', region: 'global', kind: 'commodity', icon: '🥈', currency: 'USD' },
  { yahoo: 'HG=F', symbol: 'COBRE', name: 'Cobre', exchange: 'Futuros', region: 'global', kind: 'commodity', icon: '🔶', currency: 'USD' },
]

export const CRYPTO_ASSETS: StockDef[] = [
  { yahoo: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '₿', currency: 'USD' },
  { yahoo: 'ETH-USD', symbol: 'ETH', name: 'Ethereum', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '⬡', currency: 'USD' },
  { yahoo: 'SOL-USD', symbol: 'SOL', name: 'Solana', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '◎', currency: 'USD' },
  { yahoo: 'XRP-USD', symbol: 'XRP', name: 'XRP', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '✕', currency: 'USD' },
  { yahoo: 'DOGE-USD', symbol: 'DOGE', name: 'Dogecoin', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '🐶', currency: 'USD' },
  { yahoo: 'ADA-USD', symbol: 'ADA', name: 'Cardano', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '🔷', currency: 'USD' },
  { yahoo: 'BNB-USD', symbol: 'BNB', name: 'BNB', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '🟡', currency: 'USD' },
  { yahoo: 'AVAX-USD', symbol: 'AVAX', name: 'Avalanche', exchange: 'Cripto', region: 'global', kind: 'crypto', icon: '🔺', currency: 'USD' },
]

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

/** Resolve um texto de busca para um símbolo Yahoo plausível. */
export function resolveSearchSymbol(input: string): string | null {
  const raw = input.trim().toUpperCase()
  if (!raw || raw.length > 12 || !/^[A-Z0-9.\-=^]+$/.test(raw)) return null
  const direct = ALL_STOCKS.find((s) => s.symbol === raw || s.yahoo === raw)
  if (direct) return direct.yahoo
  if (/^[A-Z]{4}\d{1,2}$/.test(raw)) return `${raw}.SA`
  return raw
}
