import { useRef, useState } from 'react'
import { AssetMark } from '@/components/assets/AssetMark'
import type { InvestorCategoryId } from '@/data/investorCategories'
import { stockByYahoo } from '@/data/stocksCatalog'
import { HorizontalScrollBar, useHorizontalDragScroll } from './HorizontalScrollBar'
import {
  categoryMeta,
  formatMockPct,
  formatMockPrice,
  MOCK_CATEGORY_QUOTES,
  MOCK_LIVE_INDICES,
  RAIL_GROUPS,
  type MockMainTab,
  type MockRanking,
} from './investmentMockData'
import './investmentMockPanel.css'

const MAIN_TABS: Array<{ id: MockMainTab; label: string }> = [
  { id: 'carteira', label: '💼 Minha carteira' },
  { id: 'favoritos', label: '★ Favoritos' },
  { id: 'investidor', label: '📈 Investidor' },
  { id: 'mercado', label: '🌐 Mercado ao vivo' },
]

function MoverRow({ yahoo, pct, price }: { yahoo: string; pct: number; price: number }) {
  const def = stockByYahoo(yahoo)
  const up = pct >= 0
  return (
    <div className="lp-inv-mover-row">
      <AssetMark def={def} yahoo={yahoo} size="sm" />
      <b>{def?.symbol ?? yahoo.replace('.SA', '')}</b>
      <span className={up ? 'green' : 'red'}>{formatMockPct(pct)}</span>
      <strong>{formatMockPrice(yahoo, price)}</strong>
    </div>
  )
}

function MoversPanel({
  category,
  ranking,
  variant,
}: {
  category: InvestorCategoryId
  ranking: MockRanking
  variant: 'preview' | 'showcase'
}) {
  const bundle = MOCK_CATEGORY_QUOTES[category]
  if (!bundle) {
    return (
      <div className={`lp-inv-rates${variant === 'showcase' ? ' showcase' : ''}`}>
        <p>Taxas CDI, IPCA e Tesouro atualizadas diariamente — igual ao app.</p>
        <div className="lp-inv-rate-chips">
          <span>CDI · 13,65% aa</span>
          <span>IPCA · 4,50% aa</span>
          <span>Selic · 14,25% aa</span>
        </div>
      </div>
    )
  }

  const showGainers = ranking !== 'down'
  const showLosers = ranking !== 'up'

  const gainers = [...bundle.gainers].sort((a, b) => {
    if (ranking === 'price') return b.price - a.price
    if (ranking === 'vol') return Math.abs(b.pct) - Math.abs(a.pct)
    return b.pct - a.pct
  })

  const losers = [...bundle.losers].sort((a, b) => {
    if (ranking === 'price') return b.price - a.price
    if (ranking === 'vol') return Math.abs(b.pct) - Math.abs(a.pct)
    return a.pct - b.pct
  })

  return (
    <div className={`lp-inv-movers${ranking === 'up' || ranking === 'down' ? ' single' : ''}`}>
      {showGainers ? (
        <div className="lp-inv-mover-col">
          <h4 className="green">Maiores altas ▲</h4>
          {gainers.map((q) => (
            <MoverRow key={`g-${q.yahoo}`} {...q} />
          ))}
        </div>
      ) : null}
      {showLosers ? (
        <div className="lp-inv-mover-col">
          <h4 className="red">Maiores baixas ▼</h4>
          {losers.map((q) => (
            <MoverRow key={`l-${q.yahoo}`} {...q} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function InvestmentMockPanel({ variant = 'preview' }: { variant?: 'preview' | 'showcase' }) {
  const [mainTab, setMainTab] = useState<MockMainTab>('investidor')
  const [category, setCategory] = useState<InvestorCategoryId>('acoes_br')
  const [ranking, setRanking] = useState<MockRanking>('up')
  const [sector, setSector] = useState<string | null>(null)
  const categoriesScrollRef = useRef<HTMLDivElement>(null)
  useHorizontalDragScroll(categoriesScrollRef, `${mainTab}-${category}`)

  const meta = categoryMeta(category)
  const sectors = meta.sectors ?? []
  const rankings = meta.rankings.filter((r) => r.id !== 'name')

  const rootClass = ['lp-inv-panel', variant === 'showcase' ? 'lp-inv-panel--showcase' : 'lp-inv-panel--preview'].join(' ')

  return (
    <div className={rootClass}>
      <div className="lp-inv-main-tabs">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={mainTab === tab.id ? 'active' : ''}
            onClick={() => {
              setMainTab(tab.id)
              if (tab.id === 'mercado') setCategory('indices')
              if (tab.id === 'favoritos') setCategory('favorites')
              if (tab.id === 'investidor') setCategory('acoes_br')
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === 'mercado' ? (
        <div className="lp-inv-live">
          <div className="lp-inv-live-head">
            <b>🌐 Mercado ao vivo</b>
            <span className="lp-inv-live-badge">
              <i /> tempo real · ~10s
            </span>
          </div>
          <div className="lp-inv-live-grid">
            {MOCK_LIVE_INDICES.map((row) => (
              <div key={row.label} className="lp-inv-live-item">
                <span>{row.icon}</span>
                <div>
                  <b>{row.label}</b>
                  <small>{row.value}</small>
                </div>
                <em className={row.pct >= 0 ? 'green' : 'red'}>
                  {row.pct === 0 ? '—' : formatMockPct(row.pct)}
                </em>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mainTab === 'carteira' ? (
        <div className="lp-inv-portfolio">
          <b>💼 Minha carteira</b>
          <small>Rendimento consolidado · demo</small>
          <div className="lp-inv-portfolio-list">
            {MOCK_CATEGORY_QUOTES.acoes_br!.gainers.slice(0, 3).map((q) => (
              <MoverRow key={q.yahoo} {...q} />
            ))}
          </div>
        </div>
      ) : null}

      {mainTab === 'favoritos' ? (
        <div className="lp-inv-portfolio">
          <b>★ Favoritos</b>
          <small>Ativos marcados com estrela</small>
          <div className="lp-inv-movers single">
            <div className="lp-inv-mover-col">
              <h4>Seus favoritos</h4>
              {MOCK_CATEGORY_QUOTES.favorites!.gainers.concat(MOCK_CATEGORY_QUOTES.favorites!.losers).map((q) => (
                <MoverRow key={q.yahoo} {...q} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mainTab === 'investidor' ? (
        <>
          <div className="lp-inv-toolbar">
            <nav className="lp-inv-side">
              <button type="button" className="active">
                💡 Ideias
              </button>
              <button type="button">⭐ Favoritos</button>
            </nav>
            <div className="lp-inv-body">
              <div className="lp-inv-cat-rail" ref={categoriesScrollRef}>
                {RAIL_GROUPS.map((group) => (
                  <div key={group.label} className="lp-inv-cat-group">
                    <span>{group.label}</span>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={category === item.id ? 'active' : ''}
                        onClick={() => {
                          setCategory(item.id)
                          setSector(null)
                          setRanking('up')
                        }}
                      >
                        {item.short}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {variant === 'preview' ? (
                <HorizontalScrollBar
                  targetRef={categoriesScrollRef}
                  label="Deslize para ver mais categorias"
                  variant="inner"
                  watchKey={`${mainTab}-${category}`}
                />
              ) : null}

              <div className="lp-inv-hero">
                <div>
                  <b>
                    {meta.icon} {meta.label}
                  </b>
                  <small>{meta.hint}</small>
                </div>
                <span className="lp-inv-live-badge">
                  <i /> tempo real · ~10s
                </span>
              </div>

              {rankings.length > 0 ? (
                <div className="lp-inv-pills">
                  {rankings.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={ranking === r.id ? 'active' : ''}
                      onClick={() => setRanking(r.id as MockRanking)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {sectors.length > 0 ? (
                <div className="lp-inv-pills muted">
                  <button type="button" className={sector === null ? 'active' : ''} onClick={() => setSector(null)}>
                    Todos
                  </button>
                  {sectors.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={sector === s.id ? 'active' : ''}
                      onClick={() => setSector(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <MoversPanel category={category} ranking={ranking} variant={variant} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
