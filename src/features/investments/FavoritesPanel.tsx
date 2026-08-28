import { useMemo, useState } from 'react'
import { useStockQuotes } from '@/data/useStockQuotes'
import type { StockQuote } from '@/data/marketSpark'
import {
  ALL_STOCKS,
  stockByYahoo,
  type AssetKind,
  type StockDef,
} from '@/data/stocksCatalog'
import {
  defMatchesCategory,
  sortCatalogRows,
  type InvestorCategoryId,
  type QuoteSortMode,
} from '@/data/investorCategories'
import { marketSessionLabel } from '@/lib/marketSession'
import { AssetMark } from '@/components/assets/AssetMark'
import { AssetDetail } from './AssetDetail'
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

type DiscoverFilter =
  | 'br_up'
  | 'br_down'
  | 'fii_up'
  | 'us_up'
  | 'bdr_up'
  | 'mine'

const FILTERS: { id: DiscoverFilter; label: string; icon: string }[] = [
  { id: 'br_up', label: 'Ações BR em alta', icon: '🇧🇷' },
  { id: 'br_down', label: 'Ações BR em baixa', icon: '🇧🇷' },
  { id: 'fii_up', label: 'FIIs em alta', icon: '🏢' },
  { id: 'us_up', label: 'Ações EUA em alta', icon: '🇺🇸' },
  { id: 'bdr_up', label: 'BDRs em alta', icon: '🌎' },
  { id: 'mine', label: 'Meus favoritos', icon: '★' },
]

const FILTER_META: Record<
  DiscoverFilter,
  { category: InvestorCategoryId | 'mine'; sort: QuoteSortMode; gainOnly?: boolean; lossOnly?: boolean }
> = {
  br_up: { category: 'acoes_br', sort: 'change_desc', gainOnly: true },
  br_down: { category: 'acoes_br', sort: 'change_asc', lossOnly: true },
  fii_up: { category: 'fiis', sort: 'change_desc', gainOnly: true },
  us_up: { category: 'stocks_us', sort: 'change_desc', gainOnly: true },
  bdr_up: { category: 'bdrs', sort: 'change_desc', gainOnly: true },
  mine: { category: 'mine', sort: 'change_desc' },
}

type Props = {
  favorites: string[]
  onToggleFavorite: (yahoo: string) => void
}

type Row = { def: StockDef; quote?: StockQuote }

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

function AssetRow({
  row,
  isFavorite,
  onOpen,
  onToggleFavorite,
}: {
  row: Row
  isFavorite: boolean
  onOpen: (s: string) => void
  onToggleFavorite: (s: string) => void
}) {
  const { def, quote: q } = row
  return (
    <div className={styles.tableRow}>
      <button
        type="button"
        className={[styles.starBtn, isFavorite ? styles.starActive : ''].filter(Boolean).join(' ')}
        onClick={() => onToggleFavorite(def.yahoo)}
        title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
      <button type="button" className={styles.assetCell} onClick={() => onOpen(def.yahoo)}>
        <AssetMark def={def} size="md" className={styles.assetIcon} />
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
}

export function FavoritesPanel({ favorites, onToggleFavorite }: Props) {
  const [filter, setFilter] = useState<DiscoverFilter>('br_up')
  const [detail, setDetail] = useState<string | null>(null)
  const session = marketSessionLabel()

  const meta = FILTER_META[filter]
  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0]

  const catalogDefs = useMemo((): StockDef[] => {
    if (filter === 'mine') {
      return favorites
        .map((y) => stockByYahoo(y))
        .filter((d): d is StockDef => !!d)
    }
    return ALL_STOCKS.filter((d) => defMatchesCategory(d, meta.category as InvestorCategoryId))
  }, [filter, favorites, meta.category])

  const symbols = useMemo(() => catalogDefs.map((d) => d.yahoo), [catalogDefs])
  const stocks = useStockQuotes(symbols.length ? symbols : undefined, symbols.length > 0)

  const quoteByYahoo = useMemo(() => {
    const map = new Map<string, StockQuote>()
    for (const q of stocks.data ?? []) map.set(q.yahoo, q)
    return map
  }, [stocks.data])

  const list = useMemo((): Row[] => {
    let rows: Row[] = catalogDefs.map((def) => ({ def, quote: quoteByYahoo.get(def.yahoo) }))
    rows = sortCatalogRows(rows, meta.sort)
    if (meta.gainOnly) rows = rows.filter((r) => (r.quote?.pctChange ?? 0) > 0)
    if (meta.lossOnly) rows = rows.filter((r) => (r.quote?.pctChange ?? 0) < 0)
    return rows
  }, [catalogDefs, quoteByYahoo, meta.sort, meta.gainOnly, meta.lossOnly])

  const favoriteRows = useMemo((): Row[] => {
    if (filter === 'mine' || favorites.length === 0) return []
    const out: Row[] = []
    for (const y of favorites) {
      const def = stockByYahoo(y)
      if (def) out.push({ def, quote: quoteByYahoo.get(y) })
    }
    return out
  }, [filter, favorites, quoteByYahoo])

  const pinned = filter !== 'mine' ? favoriteRows : []
  const pinnedSet = useMemo(() => new Set(pinned.map((r) => r.def.yahoo)), [pinned])
  const mainList = useMemo(
    () => (pinned.length > 0 ? list.filter((r) => !pinnedSet.has(r.def.yahoo)) : list),
    [list, pinned.length, pinnedSet],
  )

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.heroBar}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>★</span>
            <div>
              <div className={styles.brandTitle}>Favoritos</div>
              <div className={styles.brandSub}>
                {filter === 'mine'
                  ? favorites.length === 0
                    ? 'Toque ☆ em qualquer ativo abaixo para começar'
                    : `${favorites.length} ativo${favorites.length === 1 ? '' : 's'} salvos`
                  : `${activeFilter.icon} ${activeFilter.label} · toque ☆ para salvar`}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <span className={[styles.session, session.open ? styles.sessionOpen : ''].filter(Boolean).join(' ')}>
              {session.label}
            </span>
            <span className={styles.live}>
              <span className={stocks.isFetching ? styles.dotPulse : styles.dot} />
              {stocks.isFetching ? 'atualizando…' : session.open ? 'tempo real · ~10s' : 'atualização · ~1 min'}
            </span>
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.sectorChips} role="tablist" aria-label="Filtrar lista">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={[styles.sectorChip, filter === f.id ? styles.sectorChipActive : ''].filter(Boolean).join(' ')}
                onClick={() => setFilter(f.id)}
              >
                {f.icon} {f.label}
                {f.id === 'mine' && favorites.length > 0 ? ` (${favorites.length})` : ''}
              </button>
            ))}
          </div>

          {pinned.length > 0 && (
            <div className={[styles.tableCard, styles.blockTable].join(' ')} style={{ marginBottom: 12 }}>
              <div className={styles.subPanelTitle} style={{ padding: '12px 14px 0' }}>
                Seus favoritos
              </div>
              {pinned.map((row) => (
                <AssetRow
                  key={row.def.yahoo}
                  row={row}
                  isFavorite
                  onOpen={setDetail}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}

          <div className={[styles.tableCard, styles.blockTable].join(' ')}>
            <div className={styles.tableHead}>
              <span />
              <span>
                {filter === 'mine' ? 'Meus favoritos' : activeFilter.label}
                {mainList.length > 0 ? ` (${mainList.length})` : ''}
              </span>
              <span>Preço</span>
              <span>Var. dia</span>
              <span className={styles.colSpark}>Intraday</span>
            </div>

            {stocks.isLoading && symbols.length > 0 && <p className={styles.muted}>Carregando cotações…</p>}
            {stocks.isError && <p className={styles.muted}>Não foi possível carregar as cotações.</p>}

            {!stocks.isLoading && !stocks.isError && mainList.length === 0 && pinned.length === 0 && (
              <p className={styles.muted}>
                {filter === 'mine'
                  ? 'Nenhum favorito ainda — explore as listas acima e toque na estrela ☆.'
                  : 'Nenhum movimento neste filtro hoje. Tente outra categoria.'}
              </p>
            )}

            {mainList.map((row) => (
              <AssetRow
                key={row.def.yahoo}
                row={row}
                isFavorite={favorites.includes(row.def.yahoo)}
                onOpen={setDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          <p className={styles.disclaimer}>
            Toque ☆ para favoritar na hora. Cotações via Yahoo Finance — conteúdo informativo.
          </p>
        </div>
      </div>

      {detail && (
        <AssetDetail
          symbol={detail}
          onClose={() => setDetail(null)}
          isFavorite={favorites.includes(detail)}
          onToggleFavorite={() => onToggleFavorite(detail)}
        />
      )}
    </>
  )
}
