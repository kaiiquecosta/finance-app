import type { Investment } from '@/domain/entities'
import type { InvestmentCalcInput } from '@/domain/calc/investment'

/** Monta input de cálculo; passa `currentPrice` quando houver cotação ao vivo. */
export function toInvestmentCalcInput(
  inv: Investment,
  currentPrice?: number | null,
): InvestmentCalcInput {
  return {
    amount: inv.amount,
    type: inv.type,
    date: inv.date,
    pct: inv.pct,
    spread: inv.spread,
    yield: inv.yield,
    buyPrice: inv.buyPrice,
    currentPrice: currentPrice ?? null,
  }
}

/** Tickers Yahoo únicos dos investimentos de mercado na carteira. */
export function portfolioTickers(investments: Investment[]): string[] {
  const set = new Set<string>()
  for (const inv of investments) {
    if (inv.ticker) set.add(inv.ticker)
  }
  return [...set]
}
