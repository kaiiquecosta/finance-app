/**
 * Agrupa cotações da aba Mercado ao vivo por mercado, tipo e setor.
 */
import {
  INVESTOR_CATEGORY_GROUPS,
  categoryById,
  type InvestorCategory,
  type InvestorCategoryId,
} from './investorCategories'
import type { StockQuote } from './marketSpark'
import { stockByYahoo } from './stocksCatalog'

const MARKET_GROUP_IDS = new Set(['brasil', 'internacional'])

export interface MarketQuoteSector {
  label: string
  quotes: StockQuote[]
}

export interface MarketQuoteCategory {
  id: InvestorCategoryId
  label: string
  icon: string
  hasSectors: boolean
  sectors: MarketQuoteSector[]
}

export interface MarketQuoteGroup {
  id: string
  label: string
  categories: MarketQuoteCategory[]
}

function sortByAbsChange(quotes: StockQuote[]): StockQuote[] {
  return [...quotes].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
}

function quotesForCategory(quotes: StockQuote[], cat: InvestorCategory): StockQuote[] {
  const matched: StockQuote[] = []
  for (const q of quotes) {
    const def = stockByYahoo(q.yahoo)
    if (def && cat.match(def)) matched.push(q)
  }
  return sortByAbsChange(matched)
}

function sectorsForCategory(quotes: StockQuote[], cat: InvestorCategory): MarketQuoteSector[] {
  if (!cat.sectors?.length) {
    return quotes.length ? [{ label: '', quotes }] : []
  }

  const used = new Set<string>()
  const sectors: MarketQuoteSector[] = []

  for (const sector of cat.sectors) {
    const sectorQuotes = quotes.filter((q) => {
      const def = stockByYahoo(q.yahoo)
      return def?.tags?.includes(sector.tag)
    })
    if (!sectorQuotes.length) continue
    sectorQuotes.forEach((q) => used.add(q.yahoo))
    sectors.push({ label: sector.label, quotes: sortByAbsChange(sectorQuotes) })
  }

  const others = quotes.filter((q) => !used.has(q.yahoo))
  if (others.length) {
    sectors.push({ label: 'Outros', quotes: sortByAbsChange(others) })
  }

  return sectors
}

/** Monta grupos Brasil / Internacional com setores dentro de cada categoria. */
export function buildMarketStockGroups(quotes: StockQuote[]): MarketQuoteGroup[] {
  const groups: MarketQuoteGroup[] = []

  for (const group of INVESTOR_CATEGORY_GROUPS) {
    if (!MARKET_GROUP_IDS.has(group.id)) continue

    const categories: MarketQuoteCategory[] = []

    for (const catId of group.categories) {
      const cat = categoryById(catId)
      const catQuotes = quotesForCategory(quotes, cat)
      if (!catQuotes.length) continue

      const sectors = sectorsForCategory(catQuotes, cat)
      if (!sectors.length) continue

      categories.push({
        id: catId,
        label: cat.label,
        icon: cat.icon,
        hasSectors: Boolean(cat.sectors?.length),
        sectors,
      })
    }

    if (categories.length) {
      groups.push({ id: group.id, label: group.label, categories })
    }
  }

  return groups
}

/** Cripto agrupada: principais (BTC, ETH) vs demais altcoins. */
export function buildMarketCryptoGroups(quotes: StockQuote[]): MarketQuoteSector[] {
  const majors = new Set(['BTC-USD', 'ETH-USD'])
  const main: StockQuote[] = []
  const alt: StockQuote[] = []

  for (const q of quotes) {
    if (majors.has(q.yahoo)) main.push(q)
    else alt.push(q)
  }

  const sections: MarketQuoteSector[] = []
  if (main.length) sections.push({ label: 'Principais', quotes: sortByAbsChange(main) })
  if (alt.length) sections.push({ label: 'Altcoins', quotes: sortByAbsChange(alt) })
  return sections
}
