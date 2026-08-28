/**
 * Sugestões de produtos de renda fixa para autocomplete no cadastro.
 */
import type { InvestmentType } from '@/domain/entities'

export interface FixedIncomeSuggestion {
  name: string
  bank?: string
  pct?: number
  spread?: number
  yield?: number
}

const BANKS = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Santander',
  'Caixa',
  'Inter',
  'BTG Pactual',
  'XP Investimentos',
  'Safra',
  'Sofisa',
  'PagBank',
  'C6 Bank',
  'Original',
  'Modal',
  'Daycoval',
  'Banco Pan',
  'Agibank',
  'Will Bank',
  'Mercado Pago',
] as const

function pctProducts(typeLabel: string, banks: readonly string[], pcts: number[]): FixedIncomeSuggestion[] {
  const out: FixedIncomeSuggestion[] = []
  for (const bank of banks) {
    for (const pct of pcts) {
      out.push({ name: `${typeLabel} ${bank} ${pct}% CDI`, bank, pct })
    }
  }
  return out
}

const CDB_CATALOG: FixedIncomeSuggestion[] = [
  ...pctProducts('CDB', BANKS, [100, 110, 115, 120, 125, 130]),
  { name: 'CDB Pré-fixado', pct: 100 },
  { name: 'CDB IPCA+', pct: 100 },
]

const LCI_CATALOG: FixedIncomeSuggestion[] = [
  ...pctProducts('LCI', BANKS, [85, 90, 95, 100]),
  ...pctProducts('LCA', BANKS, [85, 90, 95, 100]),
  { name: 'LCI Pré-fixada', pct: 95 },
  { name: 'LCA Pré-fixada', pct: 95 },
]

const SELIC_CATALOG: FixedIncomeSuggestion[] = [
  { name: 'Tesouro Selic 2027', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Selic 2029', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Selic 2031', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Prefixado 2027', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Prefixado 2029', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Prefixado 2031', bank: 'Tesouro Direto', pct: 100 },
  { name: 'Tesouro Prefixado 2033', bank: 'Tesouro Direto', pct: 100 },
]

const IPCA_CATALOG: FixedIncomeSuggestion[] = [
  { name: 'Tesouro IPCA+ 2029', bank: 'Tesouro Direto', spread: 6 },
  { name: 'Tesouro IPCA+ 2035', bank: 'Tesouro Direto', spread: 6.5 },
  { name: 'Tesouro IPCA+ 2040', bank: 'Tesouro Direto', spread: 6.2 },
  { name: 'Tesouro IPCA+ 2045', bank: 'Tesouro Direto', spread: 6 },
  { name: 'Tesouro IPCA+ com Juros Semestrais 2035', bank: 'Tesouro Direto', spread: 6.3 },
  { name: 'Tesouro IPCA+ com Juros Semestrais 2045', bank: 'Tesouro Direto', spread: 6.1 },
  { name: 'Tesouro IPCA+ com Juros Semestrais 2055', bank: 'Tesouro Direto', spread: 5.9 },
]

const POUPANCA_CATALOG: FixedIncomeSuggestion[] = BANKS.map((bank) => ({
  name: `Poupança ${bank}`,
  bank,
}))

const OUTRO_CATALOG: FixedIncomeSuggestion[] = [
  { name: 'Debênture incentivada', yield: 10 },
  { name: 'CRA agrícola', yield: 12 },
  { name: 'CRI imobiliário', yield: 11 },
  { name: 'Fundo de investimento', yield: 10 },
  { name: 'COE', yield: 8 },
]

export function catalogForFixedIncomeType(type: InvestmentType): FixedIncomeSuggestion[] {
  switch (type) {
    case 'cdb':
      return CDB_CATALOG
    case 'lci':
      return LCI_CATALOG
    case 'selic':
      return SELIC_CATALOG
    case 'ipca':
      return IPCA_CATALOG
    case 'poupanca':
      return POUPANCA_CATALOG
    case 'outro':
      return OUTRO_CATALOG
    default:
      return []
  }
}

function normalizeTerm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function rankFixedIncome(s: FixedIncomeSuggestion, term: string): number {
  const name = normalizeTerm(s.name)
  const bank = normalizeTerm(s.bank ?? '')
  if (name === term) return 0
  if (name.startsWith(term)) return 1
  if (bank.startsWith(term)) return 2
  if (name.includes(term)) return 3
  return 4
}

/** Filtra sugestões de renda fixa por nome ou banco. */
export function searchFixedIncomeCatalog(
  type: InvestmentType,
  query: string,
  limit = 8,
): FixedIncomeSuggestion[] {
  const term = normalizeTerm(query)
  if (!term) return []
  const pool = catalogForFixedIncomeType(type)
  const matches = pool.filter((s) => {
    const name = normalizeTerm(s.name)
    const bank = normalizeTerm(s.bank ?? '')
    return name.includes(term) || bank.includes(term)
  })
  matches.sort((a, b) => rankFixedIncome(a, term) - rankFixedIncome(b, term))
  return matches.slice(0, limit)
}

export function supportsFixedIncomeAutocomplete(type: InvestmentType): boolean {
  return catalogForFixedIncomeType(type).length > 0
}
