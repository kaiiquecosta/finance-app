import { useMemo, useState } from 'react'
import { useStockQuotes } from '@/data/useStockQuotes'
import type { StockQuote } from '@/data/marketSpark'
import { resolveSearchSymbol, stockByYahoo, type AssetKind } from '@/data/stocksCatalog'
import { loadFavorites, saveFavorites } from '@/lib/favorites'
import { AssetDetail } from './AssetDetail'
import styles from './InvestorHub.module.css'

type Filter = 'all' | 'us' | 'br' | 'fii' | 'etf' | 'crypto' | 'fav'
type SortKey = 'change' | 'name' | 'price'

const KIND_LABEL: Record<AssetKind, string> = {
  stock: 'Ação',
  fii: 'FII',
  etf: 'ETF',
  crypto: 'Cripto',
  bdr: 'BDR',
}

function formatPrice(q: StockQuote): string {
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

function RankCard({
  title,
  icon,
  quotes,
  onOpen,
}: {
  title: string
  icon: string
  quotes: StockQuote[]
  onOpen: (symbol: string) => void
}) {
  return (
    <div className={styles.rankCard}>
      <div className={styles.rankTitle}>
        {icon} {title}
      </div>
      {quotes.length === 0 && <div className={styles.rankEmpty}>—</div>}
      {quotes.map((q, i) => (
        <button key={q.yahoo} type="button" className={styles.rankRow} onClick={() => onOpen(q.yahoo)}>
          <span className={styles.rankPos}>{i + 1}º</span>
          <span className={styles.rankSym}>
            {q.icon} {q.symbol}
          </span>
          <span className={q.pctChange >= 0 ? styles.up : styles.down}>
            {q.pctChange >= 0 ? '+' : ''}
            {q.pctChange.toFixed(2)}%
          </span>
        </button>
      ))}
    </div>
  )
}

export function InvestorHub() {
  const stocks = useStockQuotes()
  const [filter, setFilter] = useState<Filter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('change')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites())
  const session = marketSessionLabel()

  const toggleFavorite = (yahoo: string) => {
    setFavorites((prev) => {
      const next = prev.includes(yahoo) ? prev.filter((s) => s !== yahoo) : [...prev, yahoo]
      saveFavorites(next)
      return next
    })
  }

  const all = useMemo(() => stocks.data ?? [], [stocks.data])

  const filtered = useMemo(() => {
    let list = all
    if (filter === 'us') list = list.filter((q) => q.region === 'us')
    else if (filter === 'br') list = list.filter((q) => q.region === 'br' && kindOf(q) === 'stock')
    else if (filter === 'fii') list = list.filter((q) => kindOf(q) === 'fii')
    else if (filter === 'etf') list = list.filter((q) => kindOf(q) === 'etf')
    else if (filter === 'crypto') list = list.filter((q) => kindOf(q) === 'crypto')
    else if (filter === 'fav') list = list.filter((q) => favorites.includes(q.yahoo))

    const term = search.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (q) => q.symbol.toLowerCase().includes(term) || q.name.toLowerCase().includes(term),
      )
    }

    const sorted = [...list]
    if (sortKey === 'change') sorted.sort((a, b) => b.pctChange - a.pctChange)
    else if (sortKey === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    else sorted.sort((a, b) => b.price - a.price)
    return sorted
  }, [all, filter, search, sortKey, favorites])

  const gainers = useMemo(() => [...all].sort((a, b) => b.pctChange - a.pctChange).slice(0, 4), [all])
  const losers = useMemo(() => [...all].sort((a, b) => a.pctChange - b.pctChange).slice(0, 4), [all])
  const favQuotes = useMemo(() => all.filter((q) => favorites.includes(q.yahoo)).slice(0, 4), [all, favorites])

  const tape = all.slice(0, 14)
  const searchSymbol = resolveSearchSymbol(search)
  const showSearchOpen = search.trim().length >= 2 && filtered.length === 0 && searchSymbol

  return (
    <div className={styles.wrap}>
      <div className={styles.heroBar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>📈</span>
          <div>
            <div className={styles.brandTitle}>Investidor</div>
            <div className={styles.brandSub}>
              Ações, FIIs, ETFs e cripto · cotações, rankings e indicadores
            </div>
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

      {tape.length > 0 && (
        <div className={styles.tickerWrap} aria-label="Ticker de cotações">
          <div className={styles.tickerTrack}>
            {[...tape, ...tape].map((q, i) => (
              <button
                key={`${q.symbol}-${i}`}
                type="button"
                className={styles.tickerItem}
                onClick={() => setDetail(q.yahoo)}
              >
                <span className={styles.tickerSym}>
                  {q.icon} {q.symbol}
                </span>
                <span className={styles.tickerPx}>{formatPrice(q)}</span>
                <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                  {q.pctChange >= 0 ? '+' : ''}
                  {q.pctChange.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.rankGrid}>
        <RankCard title="Maiores altas" icon="🚀" quotes={gainers} onOpen={setDetail} />
        <RankCard title="Maiores baixas" icon="📉" quotes={losers} onOpen={setDetail} />
        <RankCard
          title={favorites.length ? 'Seus favoritos' : 'Favoritos (toque ☆)'}
          icon="⭐"
          quotes={favQuotes}
          onOpen={setDetail}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Buscar ativo (ex.: AAPL, PETR4, MXRF11…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showSearchOpen && searchSymbol) {
                setDetail(searchSymbol)
              }
            }}
          />
          {search && (
            <button type="button" className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpar">
              ✕
            </button>
          )}
        </div>
        <select
          className={styles.sortSelect}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Ordenar por"
        >
          <option value="change">Variação do dia</option>
          <option value="name">Nome (A–Z)</option>
          <option value="price">Maior preço</option>
        </select>
      </div>

      <div className={styles.filters}>
        {(
          [
            ['all', 'Todos'],
            ['us', '🇺🇸 EUA'],
            ['br', '🇧🇷 Ações BR'],
            ['fii', '🏢 FIIs'],
            ['etf', '🧺 ETFs'],
            ['crypto', '₿ Cripto'],
            ['fav', `⭐ Favoritos${favorites.length ? ` (${favorites.length})` : ''}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={[styles.filterBtn, filter === id ? styles.filterActive : ''].filter(Boolean).join(' ')}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span />
          <span>Ativo</span>
          <span>Preço</span>
          <span>Var. dia</span>
          <span className={styles.colSpark}>Intraday</span>
        </div>

        {stocks.isLoading && <p className={styles.muted}>Carregando cotações…</p>}
        {stocks.isError && (
          <p className={styles.muted}>Não foi possível carregar as ações agora. Tente novamente em instantes.</p>
        )}

        {!stocks.isLoading && !stocks.isError && filtered.length === 0 && !showSearchOpen && (
          <p className={styles.muted}>
            {filter === 'fav'
              ? 'Nenhum favorito ainda — toque na estrela ☆ de um ativo para acompanhar aqui.'
              : 'Nenhum ativo encontrado.'}
          </p>
        )}

        {showSearchOpen && (
          <button type="button" className={styles.searchOpenBtn} onClick={() => setDetail(searchSymbol)}>
            🔎 Abrir cotação de <b>{search.trim().toUpperCase()}</b> no Yahoo Finance
          </button>
        )}

        {!stocks.isLoading &&
          !stocks.isError &&
          filtered.map((q) => {
            const fav = favorites.includes(q.yahoo)
            return (
              <div key={q.yahoo} className={styles.tableRow}>
                <button
                  type="button"
                  className={[styles.starBtn, fav ? styles.starActive : ''].filter(Boolean).join(' ')}
                  onClick={() => toggleFavorite(q.yahoo)}
                  title={fav ? 'Remover dos favoritos' : 'Favoritar'}
                >
                  {fav ? '★' : '☆'}
                </button>
                <button type="button" className={styles.assetCell} onClick={() => setDetail(q.yahoo)}>
                  <span className={styles.assetIcon}>{q.icon}</span>
                  <span className={styles.assetText}>
                    <span className={styles.assetName}>{q.name}</span>
                    <span className={styles.assetSub}>
                      {q.symbol} · {q.exchange} · {KIND_LABEL[kindOf(q)]}
                    </span>
                  </span>
                </button>
                <span className={styles.priceCell}>{formatPrice(q)}</span>
                <span className={q.pctChange >= 0 ? styles.up : styles.down}>
                  {q.pctChange >= 0 ? '+' : ''}
                  {q.pctChange.toFixed(2)}%
                </span>
                <MiniSpark values={q.sparkline} />
              </div>
            )
          })}
      </div>

      <p className={styles.disclaimer}>
        Cotações via Yahoo Finance (delay intraday). Toque em um ativo para ver gráfico por período, retornos e
        indicadores. Conteúdo informativo — não é recomendação de investimento.
      </p>

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

function kindOf(q: StockQuote): AssetKind {
  return stockByYahoo(q.yahoo)?.kind ?? 'stock'
}
