/**
 * Busca de ativos do catálogo para cadastro na carteira (autocomplete).
 */
import {
  ALL_STOCKS,
  BR_FIIS,
  CRYPTO_ASSETS,
  normalizeSearchTicker,
  type StockDef,
} from './stocksCatalog'
import type { InvestmentType } from '@/domain/entities'

export function catalogForInvestmentType(type: InvestmentType): StockDef[] {
  switch (type) {
    case 'acoes':
      return ALL_STOCKS.filter(
        (d) => d.region === 'br' && (d.kind === 'stock' || d.kind === 'bdr' || d.kind === 'etf'),
      )
    case 'fii':
      return BR_FIIS
    case 'acoeseua':
      return ALL_STOCKS.filter(
        (d) => d.region === 'us' && (d.kind === 'stock' || d.kind === 'etf'),
      )
    case 'cripto':
      return CRYPTO_ASSETS
    default:
      return []
  }
}

/** Filtra o catálogo por texto (símbolo, nome ou Yahoo). */
export function searchInvestmentCatalog(type: InvestmentType, query: string, limit = 8): StockDef[] {
  const term = normalizeSearchTicker(query).toLowerCase()
  if (!term || term.length < 1) return []
  const pool = catalogForInvestmentType(type)
  const matches = pool.filter(
    (d) =>
      d.symbol.toLowerCase().includes(term) ||
      d.name.toLowerCase().includes(term) ||
      d.yahoo.toLowerCase().includes(term),
  )
  matches.sort((a, b) => rankMatch(a, term) - rankMatch(b, term))
  return matches.slice(0, limit)
}

function rankMatch(def: StockDef, term: string): number {
  const sym = def.symbol.toLowerCase()
  if (sym === term) return 0
  if (sym.startsWith(term)) return 1
  if (def.yahoo.toLowerCase().startsWith(term)) return 2
  return 3
}
