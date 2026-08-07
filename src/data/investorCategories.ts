/**
 * Categorias da aba Investidor (navegação lateral estilo hub de mercado).
 */
import type { StockDef } from './stocksCatalog'

export type InvestorCategoryId =
  | 'ideas'
  | 'acoes_br'
  | 'fiis'
  | 'stocks_us'
  | 'etfs'
  | 'bdrs'
  | 'crypto'
  | 'indices'
  | 'commodities'
  | 'renda_fixa'
  | 'tesouro'
  | 'favorites'

export interface InvestorSector {
  id: string
  label: string
  tag: string
}

export interface InvestorRanking {
  id: string
  label: string
  /** Ordenação aplicada na lista completa da categoria. */
  sort: 'change_desc' | 'change_asc' | 'name' | 'price_desc'
}

export interface InvestorTool {
  label: string
  description?: string
  action: 'favorites' | 'market' | 'focus_search'
}

export interface InvestorCategory {
  id: InvestorCategoryId
  label: string
  icon: string
  hint: string
  /** Se false, usa painel de taxas (sem lista Yahoo). */
  hasQuotes: boolean
  match: (def: StockDef) => boolean
  sectors?: InvestorSector[]
  rankings: InvestorRanking[]
  tools: InvestorTool[]
}

export const INVESTOR_CATEGORIES: InvestorCategory[] = [
  {
    id: 'ideas',
    label: 'Ideias',
    icon: '💡',
    hint: 'Destaques e movimentos do dia em todos os mercados.',
    hasQuotes: true,
    match: () => true,
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
      { id: 'vol', label: 'Mais voláteis', sort: 'change_desc' },
    ],
    tools: [
      { label: 'Mercado ao vivo', description: 'Índices, câmbio e taxas', action: 'market' },
      { label: 'Seus favoritos', action: 'favorites' },
    ],
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: '⭐',
    hint: 'Ativos que você marcou com estrela.',
    hasQuotes: true,
    match: () => true,
    rankings: [{ id: 'name', label: 'Nome A–Z', sort: 'name' }],
    tools: [],
  },
  {
    id: 'acoes_br',
    label: 'Ações',
    icon: '🇧🇷',
    hint: 'Ações listadas na B3.',
    hasQuotes: true,
    match: (d) => d.kind === 'stock' && d.region === 'br',
    sectors: [
      { id: 'fin', label: 'Financeiro', tag: 'financeiro' },
      { id: 'ene', label: 'Energia', tag: 'energia' },
      { id: 'mat', label: 'Materiais', tag: 'materiais' },
      { id: 'sau', label: 'Saúde', tag: 'saude' },
      { id: 'tec', label: 'Tecnologia', tag: 'tech' },
    ],
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
      { id: 'price', label: 'Maior preço', sort: 'price_desc' },
    ],
    tools: [
      { label: 'Buscar ticker B3', action: 'focus_search' },
      { label: 'Mercado ao vivo', action: 'market' },
    ],
  },
  {
    id: 'fiis',
    label: 'Fundos imobiliários',
    icon: '🏢',
    hint: 'FIIs negociados na B3.',
    hasQuotes: true,
    match: (d) => d.kind === 'fii',
    sectors: [
      { id: 'tij', label: 'Tijolo', tag: 'tijolo' },
      { id: 'pap', label: 'Papel', tag: 'papel' },
      { id: 'log', label: 'Logístico', tag: 'logistico' },
      { id: 'hib', label: 'Híbrido', tag: 'hibrido' },
      { id: 'inf', label: 'Infra', tag: 'infra' },
    ],
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
    ],
    tools: [{ label: 'Buscar FII', action: 'focus_search' }],
  },
  {
    id: 'stocks_us',
    label: 'Stocks',
    icon: '🇺🇸',
    hint: 'Ações dos EUA (NASDAQ, NYSE…).',
    hasQuotes: true,
    match: (d) => d.kind === 'stock' && d.region === 'us',
    sectors: [
      { id: 'tec', label: 'Tecnologia', tag: 'tech' },
      { id: 'fin', label: 'Financeiro', tag: 'financeiro' },
      { id: 'ene', label: 'Energia', tag: 'energia' },
    ],
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
    ],
    tools: [{ label: 'Buscar stock', action: 'focus_search' }],
  },
  {
    id: 'etfs',
    label: 'ETFs',
    icon: '🧺',
    hint: 'Fundos de índice BR e EUA.',
    hasQuotes: true,
    match: (d) => d.kind === 'etf',
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
    ],
    tools: [],
  },
  {
    id: 'bdrs',
    label: 'BDRs',
    icon: '🌎',
    hint: 'Recibos de ações estrangeiras na B3.',
    hasQuotes: true,
    match: (d) => d.kind === 'bdr',
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
    ],
    tools: [{ label: 'Buscar BDR', action: 'focus_search' }],
  },
  {
    id: 'crypto',
    label: 'Criptomoedas',
    icon: '₿',
    hint: 'Principais criptos em USD.',
    hasQuotes: true,
    match: (d) => d.kind === 'crypto',
    rankings: [
      { id: 'up', label: 'Maiores altas', sort: 'change_desc' },
      { id: 'down', label: 'Maiores baixas', sort: 'change_asc' },
    ],
    tools: [{ label: 'Mercado cripto', action: 'market' }],
  },
  {
    id: 'indices',
    label: 'Índices',
    icon: '📊',
    hint: 'Ibovespa, S&P 500, Nasdaq e outros.',
    hasQuotes: true,
    match: (d) => d.kind === 'index',
    rankings: [{ id: 'up', label: 'Variação do dia', sort: 'change_desc' }],
    tools: [{ label: 'Ver índices ao vivo', action: 'market' }],
  },
  {
    id: 'commodities',
    label: 'Commodities',
    icon: '🛢️',
    hint: 'Ouro, petróleo e metais (futuros).',
    hasQuotes: true,
    match: (d) => d.kind === 'commodity',
    rankings: [{ id: 'up', label: 'Variação do dia', sort: 'change_desc' }],
    tools: [],
  },
  {
    id: 'renda_fixa',
    label: 'Renda fixa',
    icon: '📄',
    hint: 'CDI, Selic e referências para renda fixa.',
    hasQuotes: false,
    match: () => false,
    rankings: [],
    tools: [{ label: 'Taxas ao vivo (BCB)', action: 'market' }],
  },
  {
    id: 'tesouro',
    label: 'Tesouro Direto',
    icon: '🏛️',
    hint: 'Títulos públicos — use taxas Selic e IPCA como referência.',
    hasQuotes: false,
    match: () => false,
    rankings: [],
    tools: [{ label: 'Ver Selic e IPCA', action: 'market' }],
  },
]

export function categoryById(id: InvestorCategoryId): InvestorCategory {
  return INVESTOR_CATEGORIES.find((c) => c.id === id) ?? INVESTOR_CATEGORIES[0]
}

export function defMatchesCategory(def: StockDef, categoryId: InvestorCategoryId): boolean {
  if (categoryId === 'ideas') return true
  if (categoryId === 'favorites') return true
  return categoryById(categoryId).match(def)
}

export type QuoteSortMode = InvestorRanking['sort']

export function sortQuotes<T extends { pctChange: number; name: string; price: number }>(
  list: T[],
  mode: QuoteSortMode,
): T[] {
  const sorted = [...list]
  switch (mode) {
    case 'change_desc':
      return sorted.sort((a, b) => b.pctChange - a.pctChange)
    case 'change_asc':
      return sorted.sort((a, b) => a.pctChange - b.pctChange)
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price)
    default:
      return sorted
  }
}
