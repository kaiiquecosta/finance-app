import { AssetMark } from '@/components/assets/AssetMark'
import { stockByYahoo } from '@/data/stocksCatalog'
import './investmentShowcaseVisual.css'

const GAINERS = [
  { yahoo: 'PETR4.SA', pct: '+1,99%', price: 'R$ 43,55' },
  { yahoo: 'B3SA3.SA', pct: '+1,96%', price: 'R$ 16,05' },
  { yahoo: 'VALE3.SA', pct: '+1,12%', price: 'R$ 58,90' },
]

const LOSERS = [
  { yahoo: 'MGLU3.SA', pct: '−4,55%', price: 'R$ 8,42' },
  { yahoo: 'CYRE3.SA', pct: '−2,10%', price: 'R$ 15,80' },
  { yahoo: 'GGBR4.SA', pct: '−1,85%', price: 'R$ 18,30' },
]

function StaticRow({ yahoo, pct, price, tone }: { yahoo: string; pct: string; price: string; tone: 'up' | 'down' }) {
  const def = stockByYahoo(yahoo)
  return (
    <div className="lp-inv-show-row">
      <AssetMark def={def} yahoo={yahoo} size="sm" />
      <b>{def?.symbol ?? yahoo.replace('.SA', '')}</b>
      <span className={tone}>{pct}</span>
      <strong>{price}</strong>
    </div>
  )
}

/** Visual estático da seção Investimentos — interação fica no mock do hero. */
export function InvestmentShowcaseVisual() {
  return (
    <div className="lp-inv-showcase" aria-hidden>
      <div className="lp-inv-show-tabs">
        <span>💼 Carteira</span>
        <span>★ Favoritos</span>
        <span className="on">📈 Investidor</span>
        <span>🌐 Mercado ao vivo</span>
      </div>
      <div className="lp-inv-show-head">
        <b>🇧🇷 Ações brasileiras</b>
        <small className="live">● tempo real · ~10s</small>
      </div>
      <div className="lp-inv-show-movers">
        <div>
          <h4>Maiores altas ▲</h4>
          {GAINERS.map((row) => (
            <StaticRow key={row.yahoo} {...row} tone="up" />
          ))}
        </div>
        <div>
          <h4>Maiores baixas ▼</h4>
          {LOSERS.map((row) => (
            <StaticRow key={row.yahoo} {...row} tone="down" />
          ))}
        </div>
      </div>
      <div className="lp-inv-show-rates">
        <span>CDI · 13,65% aa</span>
        <span>IPCA · 4,50% aa</span>
        <span>FIIs · ETFs · EUA</span>
      </div>
      <p className="lp-inv-show-note">Carteira, categorias e filtros completos no mock interativo no topo da página.</p>
    </div>
  )
}
