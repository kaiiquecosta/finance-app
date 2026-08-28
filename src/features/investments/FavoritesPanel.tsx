import { useMemo, useState } from 'react'
import { useStockQuotes } from '@/data/useStockQuotes'
import type { StockQuote } from '@/data/marketSpark'
import { stockByYahoo, type AssetKind, type StockDef } from '@/data/stocksCatalog'
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

function FavoriteRow({
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
  const [detail, setDetail] = useState<string | null>(null)

  const rows = useMemo((): Row[] => {
    return favorites
      .map((y) => {
        const def = stockByYahoo(y)
        return def ? { def, yahoo: y } : null
      })
      .filter((r): r is { def: StockDef; yahoo: string } => r != null)
      .map(({ def }) => ({ def }))
  }, [favorites])

  const symbols = useMemo(() => rows.map((r) => r.def.yahoo), [rows])
  const stocks = useStockQuotes(symbols.length ? symbols : undefined, symbols.length > 0)

  const quoteByYahoo = useMemo(() => {
    const map = new Map<string, StockQuote>()
    for (const q of stocks.data ?? []) map.set(q.yahoo, q)
    return map
  }, [stocks.data])

  const list = useMemo(
    (): Row[] => rows.map((row) => ({ ...row, quote: quoteByYahoo.get(row.def.yahoo) })),
    [rows, quoteByYahoo],
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
                {list.length === 0
                  ? 'Marque estrelas no Investidor para acompanhar aqui'
                  : `${list.length} ativo${list.length === 1 ? '' : 's'} · cotações ao vivo`}
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            <span className={styles.live}>
              <span className={stocks.isFetching ? styles.dotPulse : styles.dot} />
              {stocks.isFetching ? 'atualizando…' : 'tempo real · ~10s'}
            </span>
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.listAnchor} aria-hidden />
          <div className={[styles.tableCard, styles.blockTable].join(' ')}>
            <div className={styles.tableHead}>
              <span />
              <span>Ativo {list.length > 0 ? `(${list.length})` : ''}</span>
              <span>Preço</span>
              <span>Var. dia</span>
              <span className={styles.colSpark}>Intraday</span>
            </div>

            {stocks.isLoading && list.length > 0 && <p className={styles.muted}>Carregando cotações…</p>}
            {stocks.isError && <p className={styles.muted}>Não foi possível carregar as cotações.</p>}

            {list.length === 0 && (
              <p className={styles.muted}>
                Nenhum favorito ainda. Abra o <b>Investidor</b> e toque na estrela ☆ de um ativo — ele aparece aqui na
                hora.
              </p>
            )}

            {list.map((row) => (
              <FavoriteRow
                key={row.def.yahoo}
                row={row}
                isFavorite={favorites.includes(row.def.yahoo)}
                onOpen={setDetail}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          <p className={styles.disclaimer}>
            Cotações atualizadas a cada ~10s com mercado aberto. Toque em um ativo para gráfico e indicadores.
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
