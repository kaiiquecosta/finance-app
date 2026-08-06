import { useMemo, useRef, useState } from 'react'
import { useRates } from '@/data/useMarket'
import { useStockQuotes } from '@/data/useStockQuotes'
import type { StockQuote } from '@/data/marketSpark'
import {
  categoryById,
  defMatchesCategory,
  INVESTOR_CATEGORIES,
  type InvestorCategoryId,
  type QuoteSortMode,
} from '@/data/investorCategories'
import {
  ALL_STOCKS,
  normalizeSearchTicker,
  resolveSearchSymbol,
  stockByYahoo,
  type AssetKind,
  type StockDef,
} from '@/data/stocksCatalog'
import { loadFavorites, saveFavorites } from '@/lib/favorites'
import { AssetDetail } from './AssetDetail'
import { InvestorFixedIncomePanel } from './InvestorFixedIncomePanel'
import styles from './InvestorHub.module.css'

const KIND_LABEL: Record<AssetKind, string> = {
  stock: 'Ação',
  fii: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  bdr: 'BDR',
  index: 'Índice',
  commodity: 'Commodity',
}

type Props = {
  onOpenMarket?: () => void
}

type CatalogRow = { def: StockDef; quote?: StockQuote }

function formatPriceQuote(q: StockQuote): string {
  const locale = q.currency === 'BRL' ? 'pt-BR' : 'en-US'
  return q.price.toLocaleString(locale, {
    style: 'currency',
    currency: q.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}


function MiniSpark({ values }: { values: number[] }) {
  if (values.length < 2) return <div className={styles.sparkEmpty} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 56
  const h = 22
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * h}`)
    .join(' ')
  const up = values[values.length - 1] >= values[0]
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'} strokeWidth="1.5" />
    </svg>
  )
}

function marketSessionLabel(): { label: string; open: boolean } {
  const now = new Date()
  const h = now.getHours()
  const wd = now.getDay()
  const brOpen = h >= 10 && h < 18 && wd >= 1 && wd <= 5
  return { label: brOpen ? 'B3 aberta' : 'B3 fechada', open: brOpen }
}

function PopularRow({ row, onOpen }: { row: CatalogRow; onOpen: (s: string) => void }) {
  const q = row.quote
  return (
    <button type="button" className={styles.popRow} onClick={() => onOpen(row.def.yahoo)}>
      <span className={styles.popSym}>
        {row.def.icon} {row.def.symbol}
      </span>
      <span className={styles.popPx}>{q ? formatPriceQuote(q) : '—'}</span>
      {q ? (
        <span className={q.pctChange >= 0 ? styles.up : styles.down}>
          {q.pctChange >= 0 ? '+' : ''}
          {q.pctChange.toFixed(2)}%
        </span>
      ) : (
        <span className={styles.na}>…</span>
      )}
    </button>
  )
}

export function InvestorHub({ onOpenMarket }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)

  const [categoryId, setCategoryId] = useState<InvestorCategoryId>('ideas')
  const [sectorTag, setSectorTag] = useState<string | null>(null)
  const [listSort, setListSort] = useState<QuoteSortMode>('change_desc')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const session = marketSessionLabel()
  const category = categoryById(categoryId)

  const categoryDefs = useMemo((): StockDef[] => {
    if (categoryId === 'favorites') {
      return favorites
        .map((y) => stockByYahoo(y))
        .filter((d): d is StockDef => !!d)
    }
    if (categoryId === 'ideas') return ALL_STOCKS
    return ALL_STOCKS.filter((d) => defMatchesCategory(d, categoryId))
  }, [categoryId, favorites])

  const categorySymbols = useMemo(() => categoryDefs.map((d) => d.yahoo), [categoryDefs])

  const stocks = useStockQuotes(category.hasQuotes && categorySymbols.length ? categorySymbols : undefined)
  const rates = useRates()

  const toggleFavorite = (yahoo: string) => {
    setFavorites((prev) => {
      const next = prev.includes(yahoo) ? prev.filter((s) => s !== yahoo) : [...prev, yahoo]
      saveFavorites(next)
      return next
    })
  }

  const quoteByYahoo = useMemo(() => {
    const map = new Map<string, StockQuote>()
    for (const q of stocks.data ?? []) map.set(q.yahoo, q)
    return map
  }, [stocks.data])

  const catalogRows = useMemo((): CatalogRow[] => {
    return categoryDefs.map((def) => ({ def, quote: quoteByYahoo.get(def.yahoo) }))
  }, [categoryDefs, quoteByYahoo])

  const sectorFiltered = useMemo(() => {
    if (!sectorTag) return catalogRows
    return catalogRows.filter(({ def }) => def.tags?.includes(sectorTag))
  }, [catalogRows, sectorTag])

  const filtered = useMemo(() => {
    let list = sectorFiltered
    const term = normalizeSearchTicker(search).toLowerCase()
    if (term) {
      list = list.filter(
        ({ def }) =>
          def.symbol.toLowerCase().includes(term) ||
          def.name.toLowerCase().includes(term) ||
          def.yahoo.toLowerCase().includes(term),
      )
    }
    const sortable = list.map((row) => ({
      row,
      pct: row.quote?.pctChange ?? -Infinity,
      price: row.quote?.price ?? 0,
      name: row.def.name,
    }))
    sortable.sort((a, b) => {
      switch (listSort) {
        case 'change_desc':
          return b.pct - a.pct
        case 'change_asc':
          return a.pct - b.pct
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'price_desc':
          return b.price - a.price
        default:
          return 0
      }
    })
    return sortable.map((s) => s.row)
  }, [sectorFiltered, search, listSort])

  const popular = useMemo(() => {
    const withQuotes = [...catalogRows].filter((r) => r.quote)
    withQuotes.sort((a, b) => (b.quote!.pctChange ?? 0) - (a.quote!.pctChange ?? 0))
    return withQuotes.slice(0, 10)
  }, [catalogRows])

  const tape = useMemo(() => {
    return catalogRows.filter((r) => r.quote).slice(0, 14)
  }, [catalogRows])

  const searchSymbol = resolveSearchSymbol(search)
  const showSearchOpen = search.trim().length >= 2 && filtered.length === 0 && searchSymbol

  const onCategoryChange = (id: InvestorCategoryId) => {
    setCategoryId(id)
    setSectorTag(null)
    setListSort('change_desc')
    setSearch('')
  }

  const runTool = (action: 'favorites' | 'market' | 'focus_search') => {
    if (action === 'favorites') onCategoryChange('favorites')
    else if (action === 'market') onOpenMarket?.()
    else searchRef.current?.focus()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.heroBar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>📈</span>
          <div>
            <div className={styles.brandTitle}>Investidor</div>
            <div className={styles.brandSub}>Hub completo · ações, FIIs, stocks, ETFs, BDRs, cripto e mais</div>
          </div>
        </div>
        <div className={styles.heroRight}>
          <span className={[styles.session, session.open ? styles.sessionOpen : ''].filter(Boolean).join(' ')}>
            {session.label}
          </span>
          <span className={styles.live}>
            <span className={stocks.isFetching ? styles.dotPulse : styles.dot} />
            {stocks.isFetching ? 'atualizando…' : 'tempo real · ~30s'}
          </span>
        </div>
      </div>

      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Categorias de investimento">
          {INVESTOR_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              data-testid={`investor-category-${c.id}`}
              className={[styles.catBtn, categoryId === c.id ? styles.catBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => onCategoryChange(c.id)}
            >
              <span className={styles.catIcon} aria-hidden>
                {c.icon}
              </span>
              <span className={styles.catLabel}>{c.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.main}>
          <div className={styles.categoryHead}>
            <h2 className={styles.categoryTitle}>
              {category.icon} {category.label}
            </h2>
            <p className={styles.categoryHint}>{category.hint}</p>
          </div>

          {!category.hasQuotes ? (
            <InvestorFixedIncomePanel
              variant={categoryId === 'tesouro' ? 'tesouro' : 'renda_fixa'}
              rates={rates.data}
              loading={rates.isLoading}
              onOpenMarket={onOpenMarket}
            />
          ) : (
            <>
              <div className={styles.megaGrid}>
                <section className={styles.megaCol}>
                  <h3 className={styles.panelTitle}>Mais buscados</h3>
                  {popular.length === 0 && <p className={styles.muted}>Sem cotações nesta categoria.</p>}
                  {popular.map((row) => (
                    <PopularRow key={row.def.yahoo} row={row} onOpen={setDetail} />
                  ))}
                </section>

                <section className={styles.megaCol}>
                  <h3 className={styles.panelTitle}>Rankings</h3>
                  {category.rankings.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={[styles.rankLink, listSort === r.sort ? styles.rankLinkActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setListSort(r.sort)}
                    >
                      {r.label}
                    </button>
                  ))}
                  {category.sectors && category.sectors.length > 0 && (
                    <>
                      <h4 className={styles.subPanelTitle}>Setores</h4>
                      <div className={styles.sectorChips}>
                        <button
                          type="button"
                          className={[styles.sectorChip, !sectorTag ? styles.sectorChipActive : '']
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => setSectorTag(null)}
                        >
                          Todos
                        </button>
                        {category.sectors.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={[styles.sectorChip, sectorTag === s.tag ? styles.sectorChipActive : '']
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => setSectorTag(s.tag)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section className={styles.megaCol}>
                  <h3 className={styles.panelTitle}>Ferramentas</h3>
                  {category.tools.length === 0 && <p className={styles.muted}>Em breve mais atalhos.</p>}
                  {category.tools.map((t) => (
                    <button key={t.label} type="button" className={styles.toolLink} onClick={() => runTool(t.action)}>
                      <span className={styles.toolLabel}>{t.label}</span>
                      {t.description && <span className={styles.toolDesc}>{t.description}</span>}
                    </button>
                  ))}
                </section>
              </div>

              {tape.length > 0 && (
                <div className={styles.tickerWrap} aria-label="Ticker de cotações">
                  <div className={styles.tickerTrack}>
                    {[...tape, ...tape].map((row, i) => {
                      const q = row.quote!
                      return (
                      <button
                        key={`${row.def.symbol}-${i}`}
                        type="button"
                        className={styles.tickerItem}
                        onClick={() => setDetail(row.def.yahoo)}
                      >
                        <span className={styles.tickerSym}>
                          {row.def.icon} {row.def.symbol}
                        </span>
                        <span className={styles.tickerPx}>{formatPriceQuote(q)}</span>
                        <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                          {q.pctChange >= 0 ? '+' : ''}
                          {q.pctChange.toFixed(2)}%
                        </span>
                      </button>
                    )})}
                  </div>
                </div>
              )}

              <div className={styles.controls}>
                <div className={styles.searchBox}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    ref={searchRef}
                    data-testid="investor-search-input"
                    className={styles.searchInput}
                    placeholder="Buscar ativo (ex.: AAPL, PETR4, MXRF11…)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && showSearchOpen && searchSymbol) setDetail(searchSymbol)
                    }}
                  />
                  {search && (
                    <button type="button" className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpar">
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHead}>
                  <span />
                  <span>
                    Ativo {filtered.length > 0 ? `(${filtered.length})` : ''}
                  </span>
                  <span>Preço</span>
                  <span>Var. dia</span>
                  <span className={styles.colSpark}>Intraday</span>
                </div>

                {stocks.isLoading && <p className={styles.muted}>Carregando cotações…</p>}
                {stocks.isError && (
                  <p className={styles.muted}>Não foi possível carregar as cotações. Tente novamente em instantes.</p>
                )}

                {!stocks.isLoading && !stocks.isError && filtered.length === 0 && !showSearchOpen && (
                  <p className={styles.muted}>
                    {categoryId === 'favorites'
                      ? 'Nenhum favorito — toque na estrela ☆ de um ativo.'
                      : 'Nenhum ativo neste filtro.'}
                  </p>
                )}

                {showSearchOpen && (
                  <button type="button" className={styles.searchOpenBtn} onClick={() => setDetail(searchSymbol)}>
                    🔎 Abrir cotação de <b>{search.trim().toUpperCase()}</b> no Yahoo Finance
                  </button>
                )}

                {filtered.map(({ def, quote: q }) => {
                    const fav = favorites.includes(def.yahoo)
                    return (
                      <div key={def.yahoo} className={styles.tableRow}>
                        <button
                          type="button"
                          className={[styles.starBtn, fav ? styles.starActive : ''].filter(Boolean).join(' ')}
                          onClick={() => toggleFavorite(def.yahoo)}
                          title={fav ? 'Remover dos favoritos' : 'Favoritar'}
                        >
                          {fav ? '★' : '☆'}
                        </button>
                        <button type="button" className={styles.assetCell} onClick={() => setDetail(def.yahoo)}>
                          <span className={styles.assetIcon}>{def.icon}</span>
                          <span className={styles.assetText}>
                            <span className={styles.assetName}>{def.name}</span>
                            <span className={styles.assetSub}>
                              {def.symbol} · {def.exchange} · {KIND_LABEL[def.kind]}
                            </span>
                          </span>
                        </button>
                        <span className={styles.priceCell}>{q ? formatPriceQuote(q) : '—'}</span>
                        {q ? (
                          <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                            {q.pctChange >= 0 ? '+' : ''}
                            {q.pctChange.toFixed(2)}%
                          </span>
                        ) : (
                          <span className={styles.na}>…</span>
                        )}
                        {q ? <MiniSpark values={q.sparkline} /> : <div className={styles.sparkEmpty} />}
                      </div>
                    )
                  })}
              </div>
            </>
          )}

          <p className={styles.disclaimer}>
            Cotações via Yahoo Finance (delay intraday). Toque em um ativo para gráfico, retornos e indicadores.
            Conteúdo informativo — não é recomendação de investimento.
          </p>
        </div>
      </div>

      {detail && (
        <AssetDetail
          symbol={detail}
          onClose={() => setDetail(null)}
          isFavorite={favorites.includes(detail)}
          onToggleFavorite={() => toggleFavorite(detail)}
        />
      )}
    </div>
  )
}
