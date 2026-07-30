/**
 * Dados de mercado em tempo (quase) real, direto de APIs públicas gratuitas
 * com CORS liberado:
 *  - AwesomeAPI (economia.awesomeapi.com.br): câmbio e cripto em BRL, com % do dia
 *  - Banco Central (SGS): CDI, IPCA (12m) e Selic
 *
 * Ações individuais / índices (B3, S&P) exigem provedor com chave e entrarão via
 * Edge Function (proxy com cache) numa fase posterior — não dá pra fazer no
 * cliente sem expor chave.
 */

export type QuoteKind = 'currency' | 'crypto'

export interface Quote {
  code: string
  label: string
  kind: QuoteKind
  price: number // em BRL
  pctChange: number // variação % do dia
  updatedAt: number // epoch ms
}

/** Taxas de referência (frações ao ano). */
export interface Rates {
  cdi: number
  ipca: number
  selic: number
}

interface PairDef {
  pair: string
  code: string
  label: string
  kind: QuoteKind
}

const PAIRS: PairDef[] = [
  { pair: 'USD-BRL', code: 'USD', label: 'Dólar', kind: 'currency' },
  { pair: 'EUR-BRL', code: 'EUR', label: 'Euro', kind: 'currency' },
  { pair: 'GBP-BRL', code: 'GBP', label: 'Libra', kind: 'currency' },
  { pair: 'BTC-BRL', code: 'BTC', label: 'Bitcoin', kind: 'crypto' },
  { pair: 'ETH-BRL', code: 'ETH', label: 'Ethereum', kind: 'crypto' },
  { pair: 'SOL-BRL', code: 'SOL', label: 'Solana', kind: 'crypto' },
]

const AWESOME_URL = 'https://economia.awesomeapi.com.br/json/last/'
const BCB_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.'

export const DEFAULT_RATES: Rates = { cdi: 0.1365, ipca: 0.045, selic: 0.15 }

/** Normaliza a resposta da AwesomeAPI para uma lista de cotações (pura). */
export function parseQuotes(data: Record<string, { bid?: string; pctChange?: string; timestamp?: string }>): Quote[] {
  const out: Quote[] = []
  for (const p of PAIRS) {
    const q = data[p.pair.replace('-', '')]
    if (!q) continue
    const price = Number(q.bid)
    if (!Number.isFinite(price)) continue
    out.push({
      code: p.code,
      label: p.label,
      kind: p.kind,
      price,
      pctChange: Number(q.pctChange) || 0,
      updatedAt: (Number(q.timestamp) || 0) * 1000,
    })
  }
  return out
}

export async function fetchQuotes(): Promise<Quote[]> {
  const codes = PAIRS.map((p) => p.pair).join(',')
  const res = await fetch(AWESOME_URL + codes)
  if (!res.ok) throw new Error('Falha ao buscar cotações de mercado')
  return parseQuotes(await res.json())
}

/** Extrai o valor numérico da última observação de uma série do BCB (pura). */
export function parseBcbValue(data: unknown): number | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const raw = (data[data.length - 1] as { valor?: string })?.valor
  if (raw == null) return null
  const n = Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

async function bcbSeries(serie: number): Promise<number | null> {
  try {
    const res = await fetch(`${BCB_URL}${serie}/dados/ultimos/1?formato=json`)
    if (!res.ok) return null
    return parseBcbValue(await res.json())
  } catch {
    return null
  }
}

export async function fetchRates(): Promise<Rates> {
  // 4389 = CDI % a.a. | 13522 = IPCA acumulado 12m | 432 = Selic meta % a.a.
  const [cdi, ipca12m, selic] = await Promise.all([bcbSeries(4389), bcbSeries(13522), bcbSeries(432)])
  return {
    cdi: cdi != null ? cdi / 100 : DEFAULT_RATES.cdi,
    ipca: ipca12m != null ? ipca12m / 100 : DEFAULT_RATES.ipca,
    selic: selic != null ? selic / 100 : DEFAULT_RATES.selic,
  }
}
