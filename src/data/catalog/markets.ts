import { usStock, usEtf, brEtf, brBdr, crypto, indexDef, commodity } from './helpers'

export const US_STOCKS_CATALOG = [
  usStock('AAPL', 'Apple', '🍎', ['tech']),
  usStock('NVDA', 'NVIDIA', '💚', ['tech']),
  usStock('MSFT', 'Microsoft', '🪟', ['tech']),
  usStock('GOOGL', 'Alphabet', '🔍', ['tech']),
  usStock('META', 'Meta', '👤', ['tech']),
  usStock('AMZN', 'Amazon', '📦', ['tech']),
  usStock('TSLA', 'Tesla', '⚡', ['tech']),
  usStock('AMD', 'AMD', '🔥', ['tech']),
  usStock('AVGO', 'Broadcom', '📡', ['tech']),
  usStock('NFLX', 'Netflix', '🎬', ['tech']),
  usStock('COIN', 'Coinbase', '₿', ['tech']),
  usStock('PLTR', 'Palantir', '🛰️', ['tech']),
  usStock('SMCI', 'Super Micro', '🖥️', ['tech']),
  usStock('BRK-B', 'Berkshire', '🏛️', ['financeiro']),
  usStock('JPM', 'JPMorgan', '🏦', ['financeiro']),
  usStock('V', 'Visa', '💳', ['financeiro']),
  usStock('DIS', 'Disney', '🏰'),
  usStock('MCD', "McDonald's", '🍟'),
  usStock('XOM', 'ExxonMobil', '⛽', ['energia']),
  usStock('WMT', 'Walmart', '🛒'),
  usStock('ORCL', 'Oracle', '🗄️', ['tech']),
  usStock('CRM', 'Salesforce', '☁️', ['tech']),
  usStock('INTC', 'Intel', '💻', ['tech']),
  usStock('BA', 'Boeing', '✈️'),
  usStock('NKE', 'Nike', '👟'),
  usStock('COST', 'Costco', '🛒'),
  usStock('LLY', 'Eli Lilly', '💊', ['saude']),
  usStock('UNH', 'UnitedHealth', '🏥', ['saude']),
  usStock('MA', 'Mastercard', '💳', ['financeiro']),
  usStock('HD', 'Home Depot', '🔨'),
]

export const ETFS_CATALOG = [
  brEtf('BOVA11', 'iShares Ibovespa', '📊'),
  brEtf('IVVB11', 'iShares S&P 500', '🇺🇸'),
  brEtf('SMAL11', 'iShares Small Caps', '🔬'),
  brEtf('DIVO11', 'IT Now IDIV', '💰'),
  brEtf('GOLD11', 'ETF Ouro', '🥇'),
  brEtf('BOVV11', 'BOVA Vanguard Ibov', '📊'),
  brEtf('HASH11', 'Hashdex Nasdaq Crypto', '₿'),
  usEtf('SPY', 'SPDR S&P 500', 'NYSE', '🦅'),
  usEtf('QQQ', 'Invesco Nasdaq 100', 'NASDAQ', '💻'),
  usEtf('VOO', 'Vanguard S&P 500', 'NYSE', '🧭'),
  usEtf('IWM', 'Russell 2000', 'NYSE', '📈'),
  usEtf('DIA', 'Dow Jones ETF', 'NYSE', '📊'),
  usEtf('VTI', 'Vanguard Total Market', 'NYSE', '🌐'),
]

export const BDRS_CATALOG = [
  brBdr('AAPL34', 'Apple BDR', '🍎', ['tech']),
  brBdr('MSFT34', 'Microsoft BDR', '🪟', ['tech']),
  brBdr('NVDC34', 'NVIDIA BDR', '💚', ['tech']),
  brBdr('AMZO34', 'Amazon BDR', '📦', ['tech']),
  brBdr('GOGL34', 'Alphabet BDR', '🔍', ['tech']),
  brBdr('TSLA34', 'Tesla BDR', '⚡', ['tech']),
  brBdr('DISB34', 'Disney BDR', '🏰'),
  brBdr('META34', 'Meta BDR', '👤', ['tech']),
  brBdr('NFLX34', 'Netflix BDR', '🎬', ['tech']),
  brBdr('M1TA34', 'Meta BDR alt', '👤'),
  brBdr('BABA34', 'Alibaba BDR', '🛒'),
  brBdr('INBR32', 'Inter & Co BDR', '🏦'),
]

export const CRYPTO_CATALOG = [
  crypto('BTC', 'Bitcoin', '₿'),
  crypto('ETH', 'Ethereum', '⬡'),
  crypto('SOL', 'Solana', '◎'),
  crypto('XRP', 'XRP', '✕'),
  crypto('DOGE', 'Dogecoin', '🐶'),
  crypto('ADA', 'Cardano', '🔷'),
  crypto('BNB', 'BNB', '🟡'),
  crypto('AVAX', 'Avalanche', '🔺'),
  crypto('LINK', 'Chainlink', '🔗'),
  crypto('MATIC', 'Polygon', '🟣'),
]

export const INDICES_CATALOG = [
  indexDef('^BVSP', 'IBOV', 'Ibovespa', 'br', '🇧🇷'),
  indexDef('^GSPC', 'S&P 500', 'S&P 500', 'us', '🇺🇸'),
  indexDef('^IXIC', 'NASDAQ', 'Nasdaq Composite', 'us', '💻'),
  indexDef('^DJI', 'DOW', 'Dow Jones', 'us', '📊'),
  indexDef('^RUT', 'RUT', 'Russell 2000', 'us', '🔬'),
  indexDef('^VIX', 'VIX', 'Índice de volatilidade', 'us', '🌪️'),
  indexDef('^FTSE', 'FTSE', 'FTSE 100', 'us', '🇬🇧'),
  indexDef('^N225', 'NIKKEI', 'Nikkei 225', 'us', '🇯🇵'),
]

export const COMMODITIES_CATALOG = [
  commodity('GC=F', 'OURO', 'Ouro', '🥇'),
  commodity('CL=F', 'WTI', 'Petróleo WTI', '🛢️'),
  commodity('BZ=F', 'BRENT', 'Petróleo Brent', '⛽'),
  commodity('SI=F', 'PRATA', 'Prata', '🥈'),
  commodity('HG=F', 'COBRE', 'Cobre', '🔶'),
  commodity('NG=F', 'GAS', 'Gás natural', '🔥'),
]
