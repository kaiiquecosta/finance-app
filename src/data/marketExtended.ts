/**
 * Índices e câmbio estendidos (AwesomeAPI), alinhado ao legado.
 */
import type { Quote } from './market'
import { parseQuotes } from './market'

const AWESOME = 'https://economia.awesomeapi.com.br/json/last/'

export interface IndexQuote {
  code: string
  label: string
  icon: string
  value: string
  pctChange: number
  sub?: string
}

export async function fetchExtendedQuotes(): Promise<Quote[]> {
  const pairs = 'USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,ETH-BRL,SOL-BRL'
  const res = await fetch(AWESOME + pairs)
  if (!res.ok) throw new Error('Falha ao buscar câmbio/cripto')
  return parseQuotes(await res.json())
}

export async function fetchMarketIndices(): Promise<IndexQuote[]> {
  const out: IndexQuote[] = []
  try {
    const res = await fetch(`${AWESOME}IBOVESPA-BRL,SP500-USD`)
    if (res.ok) {
      const j = (await res.json()) as Record<string, { bid?: string; pctChange?: string }>
      if (j.IBOVESPABRL) {
        const v = Number(j.IBOVESPABRL.bid)
        out.push({
          code: 'IBOV',
          label: 'Ibovespa',
          icon: '📊',
          value: Number.isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' pts' : '—',
          pctChange: Number(j.IBOVESPABRL.pctChange) || 0,
          sub: 'B3',
        })
      }
      if (j.SP500USD) {
        const v = Number(j.SP500USD.bid)
        out.push({
          code: 'SP500',
          label: 'S&P 500',
          icon: '🇺🇸',
          value: Number.isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' pts' : '—',
          pctChange: Number(j.SP500USD.pctChange) || 0,
          sub: 'NYSE/NASDAQ',
        })
      }
    }
  } catch {
    /* ignore */
  }
  return out
}

export async function fetchCryptoUsd(): Promise<IndexQuote[]> {
  try {
    const res = await fetch(`${AWESOME}BTC-USD,ETH-USD,SOL-USD`)
    if (!res.ok) return []
    const j = (await res.json()) as Record<string, { bid?: string; pctChange?: string }>
    const map: [string, string, string][] = [
      ['BTCUSD', 'Bitcoin', '₿'],
      ['ETHUSD', 'Ethereum', '⬡'],
      ['SOLUSD', 'Solana', '◎'],
    ]
    return map
      .map(([key, label, icon]) => {
        const row = j[key]
        if (!row) return null
        const v = Number(row.bid)
        return {
          code: key.replace('USD', ''),
          label,
          icon,
          value: Number.isFinite(v)
            ? 'US$ ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '—',
          pctChange: Number(row.pctChange) || 0,
          sub: `${key.replace('USD', '')}/USD`,
        }
      })
      .filter(Boolean) as IndexQuote[]
  } catch {
    return []
  }
}
