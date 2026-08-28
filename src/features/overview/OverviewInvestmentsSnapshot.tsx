import { useMemo } from 'react'
import { formatBRL, type Cents } from '@/domain/money'
import { calcInvestment, type MarketRates } from '@/domain/calc/investment'
import type { Investment } from '@/domain/entities'
import { useStockQuotes } from '@/data/useStockQuotes'
import { portfolioTickers, toInvestmentCalcInput } from '@/features/investments/investmentCalc'
import { Card } from '@/components/ui/Card'

export function OverviewInvestmentsSnapshot({
  investments,
  market,
  onSeeAll,
  onAdd,
}: {
  investments: Investment[]
  market: MarketRates | null
  onSeeAll: () => void
  onAdd: () => void
}) {
  const rates = market ?? { cdi: 0.1365, ipca: 0.045 }
  const asOf = new Date()
  const list = investments.slice(0, 4)

  const tickers = useMemo(() => portfolioTickers(investments), [investments])
  const stockQuotes = useStockQuotes(tickers.length ? tickers : undefined)
  const quoteByYahoo = useMemo(() => {
    const map = new Map<string, number>()
    for (const q of stockQuotes.data ?? []) map.set(q.yahoo, q.price)
    return map
  }, [stockQuotes.data])

  let totalApplied = 0
  let totalNet = 0
  for (const inv of investments) {
    totalApplied += Number(inv.amount)
    const r = calcInvestment(
      toInvestmentCalcInput(inv, inv.ticker ? quoteByYahoo.get(inv.ticker) : null),
      asOf,
      rates,
    )
    totalNet += Number(r.netYield)
  }

  return (
    <Card
      title="📈 Investimentos"
      action={
        <button type="button" className="card-link" onClick={onSeeAll}>
          ver todos →
        </button>
      }
    >
      {investments.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Nenhum investimento.{' '}
          <button type="button" className="card-link" onClick={onAdd}>
            Adicionar →
          </button>
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ textAlign: 'center', padding: 10, borderRadius: 12, background: 'var(--raise, transparent)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Aplicado</div>
              <div className="num-md">{formatBRL(totalApplied as Cents)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 10, borderRadius: 12, background: 'var(--raise, transparent)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Rend. líq.</div>
              <div className="num-md num-green">{formatBRL(totalNet as Cents)}</div>
            </div>
          </div>
          {list.map((inv) => {
            const r = calcInvestment(
              toInvestmentCalcInput(inv, inv.ticker ? quoteByYahoo.get(inv.ticker) : null),
              asOf,
              rates,
            )
            return (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{inv.name}</span>
                <span style={{ fontFamily: 'var(--num)', fontSize: 13 }}>{formatBRL(inv.amount)}</span>
                <span className="num-green" style={{ fontFamily: 'var(--num)', fontSize: 12 }}>
                  +{formatBRL(r.netYield)}
                </span>
              </div>
            )
          })}
        </>
      )}
    </Card>
  )
}
