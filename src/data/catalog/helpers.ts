import type { StockDef, StockRegion } from './types'

export function brFii(symbol: string, name: string, tags?: string[]): StockDef {
  return {
    yahoo: `${symbol}.SA`,
    symbol,
    name,
    exchange: 'B3',
    region: 'br',
    kind: 'fii',
    icon: '🏢',
    currency: 'BRL',
    tags,
  }
}

export function brStock(
  symbol: string,
  name: string,
  tags?: string[],
  icon = '📈',
): StockDef {
  return {
    yahoo: `${symbol}.SA`,
    symbol,
    name,
    exchange: 'B3',
    region: 'br',
    kind: 'stock',
    icon,
    currency: 'BRL',
    tags,
  }
}

export function usStock(symbol: string, name: string, icon: string, tags?: string[]): StockDef {
  return {
    yahoo: symbol,
    symbol,
    name,
    exchange: 'EUA',
    region: 'us',
    kind: 'stock',
    icon,
    currency: 'USD',
    tags,
  }
}

export function brEtf(symbol: string, name: string, icon = '🧺'): StockDef {
  return {
    yahoo: `${symbol}.SA`,
    symbol,
    name,
    exchange: 'B3',
    region: 'br',
    kind: 'etf',
    icon,
    currency: 'BRL',
  }
}

export function usEtf(symbol: string, name: string, exchange: string, icon: string): StockDef {
  return {
    yahoo: symbol,
    symbol,
    name,
    exchange,
    region: 'us',
    kind: 'etf',
    icon,
    currency: 'USD',
  }
}

export function brBdr(symbol: string, name: string, icon: string, tags?: string[]): StockDef {
  return {
    yahoo: `${symbol}.SA`,
    symbol,
    name,
    exchange: 'B3',
    region: 'br',
    kind: 'bdr',
    icon,
    currency: 'BRL',
    tags,
  }
}

export function crypto(symbol: string, name: string, icon: string): StockDef {
  return {
    yahoo: `${symbol}-USD`,
    symbol,
    name,
    exchange: 'Cripto',
    region: 'global',
    kind: 'crypto',
    icon,
    currency: 'USD',
  }
}

export function indexDef(
  yahoo: string,
  symbol: string,
  name: string,
  region: StockRegion,
  icon: string,
): StockDef {
  return {
    yahoo,
    symbol,
    name,
    exchange: region === 'br' ? 'Brasil' : 'Global',
    region,
    kind: 'index',
    icon,
    currency: region === 'br' ? 'BRL' : 'USD',
  }
}

export function commodity(yahoo: string, symbol: string, name: string, icon: string): StockDef {
  return {
    yahoo,
    symbol,
    name,
    exchange: 'Futuros',
    region: 'global',
    kind: 'commodity',
    icon,
    currency: 'USD',
  }
}

/** Corrige typos comuns na busca (ex.: MXFR11 → MXRF11). */
export function normalizeSearchTicker(raw: string): string {
  const u = raw.trim().toUpperCase()
  const aliases: Record<string, string> = {
    MXFR11: 'MXRF11',
    MXRF11: 'MXRF11',
  }
  return aliases[u] ?? u
}
