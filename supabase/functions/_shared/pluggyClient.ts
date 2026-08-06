/**
 * Cliente HTTP mínimo da Pluggy API (v1 base URL api.pluggy.ai).
 * Usado apenas em Edge Functions — credenciais nunca no frontend.
 * @see https://docs.pluggy.ai/reference/auth
 */

const PLUGGY_BASE = Deno.env.get('PLUGGY_API_BASE') ?? 'https://api.pluggy.ai'

export type PluggyApiKey = { apiKey: string; expiresAt: number }

let cachedKey: PluggyApiKey | null = null

export async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID')
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configurados (supabase secrets set).')
  }
  const now = Date.now()
  if (cachedKey && cachedKey.expiresAt > now + 60_000) return cachedKey.apiKey

  const res = await fetch(`${PLUGGY_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pluggy auth falhou (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { apiKey: string }
  cachedKey = { apiKey: data.apiKey, expiresAt: now + 2 * 60 * 60 * 1000 }
  return data.apiKey
}

async function pluggyGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = await getPluggyApiKey()
  const url = new URL(path.startsWith('http') ? path : `${PLUGGY_BASE}${path}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url, { headers: { 'X-API-KEY': apiKey } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pluggy GET ${url.pathname} (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}

export interface PluggyItem {
  id: string
  status: string
  connector?: { id?: number; name?: string }
}

export interface PluggyAccount {
  id: string
  type: string
  subtype?: string
  name: string
  balance?: number
  creditData?: { creditLimit?: number }
  currencyCode?: string
}

export interface PluggyTransaction {
  id: string
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  date: string
  category?: { id?: string; description?: string } | null
  accountId?: string
}

export async function listItems(): Promise<PluggyItem[]> {
  const data = await pluggyGet<{ results?: PluggyItem[] }>('/items', { pageSize: 100 })
  return data.results ?? []
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  return pluggyGet<PluggyItem>(`/items/${itemId}`)
}

export async function listAccounts(itemId: string): Promise<PluggyAccount[]> {
  const data = await pluggyGet<{ results?: PluggyAccount[] }>('/accounts', { itemId })
  return data.results ?? []
}

export interface PluggyTransactionsPage {
  results: PluggyTransaction[]
  page?: number
  total?: number
  totalPages?: number
}

/** Lista transações (paginação por page; cursor `after` quando disponível). */
export async function listTransactions(params: {
  accountId: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  after?: string
}): Promise<PluggyTransactionsPage> {
  return pluggyGet<PluggyTransactionsPage>('/transactions', {
    accountId: params.accountId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 500,
    after: params.after,
  })
}

/** Itera todas as páginas de transações de uma conta. */
export async function* iterateAllTransactions(
  accountId: string,
  opts: { dateFrom?: string; dateTo?: string } = {},
): AsyncGenerator<PluggyTransaction> {
  let page = 1
  let after: string | undefined
  for (;;) {
    const batch = await listTransactions({
      accountId,
      dateFrom: opts.dateFrom,
      dateTo: opts.dateTo,
      page,
      pageSize: 500,
      after,
    })
    const rows = batch.results ?? []
    for (const tx of rows) yield tx
    if (rows.length < 500) break
    page += 1
    if (page > 200) break
  }
}

export async function createConnectToken(clientUserId: string): Promise<string> {
  const apiKey = await getPluggyApiKey()
  const res = await fetch(`${PLUGGY_BASE}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ clientUserId }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pluggy connect_token (${res.status}): ${text}`)
  }
  const data = (await res.json()) as { accessToken: string }
  return data.accessToken
}
