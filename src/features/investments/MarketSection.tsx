import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { AssetMark } from '@/components/assets/AssetMark'
import { useRates } from '@/data/useMarket'
import { useCryptoUsd, useExtendedQuotes, useMarketIndices } from '@/data/useMarketExtended'
import { useStockQuotes } from '@/data/useStockQuotes'
import {
  buildMarketCryptoGroups,
  buildMarketStockCategory,
  filterCategorySectors,
  MARKET_STOCK_FILTERS,
  marketStockFilterSymbols,
} from '@/data/marketStockGroups'
import { categoryById, type InvestorCategoryId } from '@/data/investorCategories'
import type { Quote } from '@/data/market'
import type { IndexQuote } from '@/data/marketExtended'
import type { StockQuote } from '@/data/marketSpark'
import { stockByYahoo } from '@/data/stocksCatalog'
import { MarketMovers } from './MarketMovers'
import styles from './MarketSection.module.css'

type MktTab = 'indices' | 'crypto' | 'stocks'

function formatPrice(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: v >= 1000 ? 0 : 2,
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  })
}

function QuoteRow({ q }: { q: Quote }) {
  const prev = useRef(q.price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    const previous = prev.current
    prev.current = q.price
    if (q.price === previous) return
    setFlash(q.price > previous ? 'up' : 'down')
    const t = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(t)
  }, [q.price])

  const up = q.pctChange >= 0
  return (
    <div className={[styles.row, flash ? styles[`flash_${flash}`] : ''].filter(Boolean).join(' ')}>
      <div className={styles.rowInfo}>
        <span className={styles.code}>{q.code}</span>
        <span className={styles.label}>{q.label}</span>
      </div>
      <div className={styles.rowRight}>
        <span className={styles.price}>{formatPrice(q.price)}</span>
        <span className={up ? styles.pctUp : styles.pctDown}>
          {up ? '▲' : '▼'} {Math.abs(q.pctChange).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function IndexRow({ q }: { q: IndexQuote }) {
  const up = q.pctChange >= 0
  return (
    <div className={styles.row}>
      <div className={styles.rowInfo}>
        <span className={styles.code}>
          {q.icon} {q.label}
        </span>
        <span className={styles.label}>{q.sub ?? q.code}</span>
      </div>
      <div className={styles.rowRight}>
        <span className={styles.price}>{q.value}</span>
        {q.pctChange !== 0 && (
          <span className={up ? styles.pctUp : styles.pctDown}>
            {up ? '▲' : '▼'} {Math.abs(q.pctChange).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

function StockRow({ q }: { q: StockQuote }) {
  const up = q.pctChange >= 0
  const def = stockByYahoo(q.yahoo)
  const price =
    q.currency === 'BRL'
      ? q.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : q.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return (
    <div className={styles.row}>
      <div className={styles.rowInfo}>
        <span className={styles.rowLead}>
          <AssetMark def={def ?? { symbol: q.symbol, kind: 'stock', region: q.region, icon: q.icon, yahoo: q.yahoo }} size="sm" />
          <span className={styles.code}>{q.symbol}</span>
        </span>
        <span className={styles.label}>
          {q.name} · {q.exchange}
        </span>
      </div>
      <div className={styles.rowRight}>
        <span className={styles.price}>{price}</span>
        <span className={up ? styles.pctUp : styles.pctDown}>
          {up ? '▲' : '▼'} {Math.abs(q.pctChange).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function RateChip({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.rate}>
      <span className={styles.rateLabel}>{label}</span>
      <span className={styles.rateValue}>{(value * 100).toFixed(2).replace('.', ',')}%</span>
    </div>
  )
}

function sessionBadge(): { text: string; open: boolean } {
  const now = new Date()
  const h = now.getHours()
  const wd = now.getDay()
  const open = h >= 10 && h < 18 && wd >= 1 && wd <= 5
  return { text: open ? 'Aberto' : 'Fechado', open }
}

export function MarketSection() {
  const [tab, setTab] = useState<MktTab>('indices')
  const [stockFilter, setStockFilter] = useState<InvestorCategoryId>('acoes_br')
  const [sectorTag, setSectorTag] = useState<string | null>(null)
  const quotes = useExtendedQuotes()
  const rates = useRates()
  const indices = useMarketIndices()
  const cryptoUsd = useCryptoUsd()

  const stockSymbols = useMemo(() => marketStockFilterSymbols(stockFilter), [stockFilter])
  const cryptoSymbols = useMemo(() => marketStockFilterSymbols('crypto'), [])

  const stocksTab = useStockQuotes(stockSymbols, tab === 'stocks')
  const stocksCrypto = useStockQuotes(cryptoSymbols, tab === 'crypto')

  const session = sessionBadge()
  const activeCategory = categoryById(stockFilter)

  const stockCategoryView = useMemo(() => {
    const base = buildMarketStockCategory(stocksTab.data ?? [], stockFilter)
    if (!base) return null
    return filterCategorySectors(base, sectorTag)
  }, [stocksTab.data, stockFilter, sectorTag])

  const stockQuotesFiltered = useMemo(() => stocksTab.data ?? [], [stocksTab.data])

  const cryptoGroups = useMemo(() => buildMarketCryptoGroups(stocksCrypto.data ?? []), [stocksCrypto.data])

  const list = quotes.data ?? []
  const currencies = list.filter((q) => q.kind === 'currency')
  const cryptoBrl = list.filter((q) => q.kind === 'crypto')

  const refetchAll = () => {
    void quotes.refetch()
    void indices.refetch()
    void cryptoUsd.refetch()
    void stocksTab.refetch()
    void stocksCrypto.refetch()
    void rates.refetch()
  }

  const busy =
    quotes.isFetching || stocksTab.isFetching || stocksCrypto.isFetching || indices.isFetching

  const selectStockFilter = (id: InvestorCategoryId) => {
    setStockFilter(id)
    setSectorTag(null)
  }

  return (
    <>
      {rates.data && (
        <Card title="Taxas de referência" className={styles.mt} action={<span className={styles.source}>Banco Central</span>}>
          <div className={styles.rates}>
            <RateChip label="CDI" value={rates.data.cdi} />
            <RateChip label="IPCA (12m)" value={rates.data.ipca} />
            <RateChip label="Selic" value={rates.data.selic} />
          </div>
        </Card>
      )}

      <Card
        className={styles.mt}
        title={
          <span>
            <span className="icon">🌐</span> Mercado ao vivo
          </span>
        }
        action={
          <div className={styles.toolbar}>
            <span className={[styles.status, session.open ? styles.statusOpen : ''].filter(Boolean).join(' ')}>
              {session.text}
            </span>
            <span className={styles.live}>
              <span className={busy ? `${styles.dot} ${styles.dotPulse}` : styles.dot} />
              {busy ? 'atualizando…' : 'ao vivo'}
            </span>
            <button type="button" className={styles.refreshBtn} onClick={refetchAll}>
              ↻ Atualizar
            </button>
          </div>
        }
      >
        <div className={styles.tabs}>
          {(
            [
              ['indices', 'Índices'],
              ['crypto', 'Cripto'],
              ['stocks', 'Ações'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={[styles.tab, tab === id ? styles.tabActive : ''].filter(Boolean).join(' ')}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'indices' && (
          <div className={styles.panel}>
            {rates.data && (
              <>
                <IndexRow
                  q={{
                    code: 'SELIC',
                    label: 'Selic',
                    icon: '🏦',
                    value: (rates.data.selic * 100).toFixed(2).replace('.', ',') + '% a.a.',
                    pctChange: 0,
                    sub: 'Taxa básica',
                  }}
                />
                <IndexRow
                  q={{
                    code: 'CDI',
                    label: 'CDI',
                    icon: '💰',
                    value: (rates.data.cdi * 100).toFixed(2).replace('.', ',') + '% a.a.',
                    pctChange: 0,
                    sub: 'Referência renda fixa',
                  }}
                />
              </>
            )}
            {(indices.data ?? []).map((q) => (
              <IndexRow key={q.code} q={q} />
            ))}
            {currencies.map((q) => (
              <QuoteRow key={q.code} q={q} />
            ))}
            {indices.isLoading && quotes.isLoading && <p className={styles.muted}>Carregando índices…</p>}
          </div>
        )}

        {tab === 'crypto' && (
          <div className={styles.panel}>
            <p className={styles.sectionHint}>Cripto em USD (referência global)</p>
            {(cryptoUsd.data ?? []).map((q) => (
              <IndexRow key={q.code} q={q} />
            ))}
            <p className={styles.sectionHint}>Cripto em BRL</p>
            {cryptoBrl.map((q) => (
              <QuoteRow key={q.code} q={q} />
            ))}
            {cryptoGroups.length > 0 && (
              <>
                <p className={styles.sectionHint}>Catálogo · variação do dia</p>
                {cryptoGroups.map((sector) => (
                  <div key={sector.label} className={styles.categoryBlock}>
                    <div className={styles.sectorHead}>{sector.label}</div>
                    {sector.quotes.map((q) => (
                      <StockRow key={q.yahoo} q={q} />
                    ))}
                  </div>
                ))}
              </>
            )}
            {quotes.isLoading && cryptoUsd.isLoading && <p className={styles.muted}>Carregando cripto…</p>}
          </div>
        )}

        {tab === 'stocks' && (
          <div className={styles.panel}>
            <div className={styles.filterScroll} role="group" aria-label="Tipo de ativo">
              {MARKET_STOCK_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={[styles.filterPill, stockFilter === f.id ? styles.filterPillActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectStockFilter(f.id)}
                >
                  <span aria-hidden>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>

            {activeCategory.sectors && activeCategory.sectors.length > 0 && (
              <div className={styles.filterScroll} role="group" aria-label="Setor">
                <button
                  type="button"
                  className={[styles.filterPill, styles.filterPillSub, !sectorTag ? styles.filterPillActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSectorTag(null)}
                >
                  Todos os setores
                </button>
                {activeCategory.sectors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={[styles.filterPill, styles.filterPillSub, sectorTag === s.tag ? styles.filterPillActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSectorTag(s.tag)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <p className={styles.filterHint}>
              {activeCategory.icon} {activeCategory.label}
              {sectorTag ? ` · ${activeCategory.sectors?.find((s) => s.tag === sectorTag)?.label}` : ''}
              {' · '}
              {stocksTab.isFetching ? 'atualizando…' : 'cotações ao vivo'}
            </p>

            {stocksTab.isLoading && <p className={styles.muted}>Carregando {activeCategory.label.toLowerCase()}…</p>}
            {stocksTab.isError && <p className={styles.muted}>Não foi possível carregar. Use ↻ Atualizar.</p>}
            {!stocksTab.isLoading && !stocksTab.isError && !stockCategoryView && (
              <p className={styles.muted}>Nenhuma cotação disponível neste filtro.</p>
            )}

            {stockQuotesFiltered.length > 0 && <MarketMovers quotes={stockQuotesFiltered} />}

            {stockCategoryView && (
              <div className={styles.categoryBlock}>
                {stockCategoryView.sectors.map((sector) => (
                  <div key={`${stockCategoryView.id}-${sector.label || 'all'}`} className={styles.sectorBlock}>
                    {stockCategoryView.hasSectors && sector.label && (
                      <div className={styles.sectorHead}>{sector.label}</div>
                    )}
                    {sector.quotes.map((q) => (
                      <StockRow key={q.yahoo} q={q} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}
