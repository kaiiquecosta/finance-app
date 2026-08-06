/**
 * Sincroniza contas e transações Pluggy → Supabase (transactions + transaction_imports).
 *
 * Body JSON:
 *   connectionId?: uuid — sincroniza só esta conexão
 *   dateFrom?: "YYYY-MM-DD" — padrão: 90 dias atrás
 *   dateTo?: "YYYY-MM-DD"
 *
 * Secrets: PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, json } from '../_shared/cors.ts'
import {
  getItem,
  iterateAllTransactions,
  listAccounts,
  type PluggyAccount,
} from '../_shared/pluggyClient.ts'

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function pluggyToFluxAmount(amount: number, type: 'CREDIT' | 'DEBIT'): number {
  const abs = Math.abs(Number(amount))
  return type === 'CREDIT' ? abs : -abs
}

function mapCategory(desc?: string | null): string {
  const d = (desc ?? '').toLowerCase()
  if (!d) return 'outros'
  if (/mercado|supermercado|grocery/.test(d)) return 'mercado'
  if (/food|restaurant|aliment|ifood|delivery/.test(d)) return 'alimentação'
  if (/transport|uber|99|combust|gasolina/.test(d)) return 'transporte'
  if (/health|farmác|farmaci|médic|medic/.test(d)) return 'saúde'
  if (/salary|salário|payroll|receita|income|deposit/.test(d)) return 'receita'
  if (/invest|cdb|fii|ações/.test(d)) return 'investimento'
  if (/streaming|netflix|spotify/.test(d)) return 'streaming'
  if (/moradia|aluguel|condomínio|energia|água|internet/.test(d)) return 'moradia'
  return 'outros'
}

function newTransactionId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autenticado' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Sessão inválida' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = (await req.json().catch(() => ({}))) as {
      connectionId?: string
      dateFrom?: string
      dateTo?: string
    }

    const dateFrom = body.dateFrom ?? isoDateDaysAgo(90)
    const dateTo = body.dateTo

    let connQuery = admin
      .from('financial_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'pluggy')
    if (body.connectionId) connQuery = connQuery.eq('id', body.connectionId)

    const { data: connections, error: connErr } = await connQuery
    if (connErr) throw connErr
    if (!connections?.length) {
      return json({
        error: 'Nenhuma conexão Pluggy cadastrada. Registre o Item ID do Meu Pluggy em financial_connections.',
        hint: 'docs/PLUGGY.md',
      }, 400)
    }

    let accountsSynced = 0
    let transactionsImported = 0
    let transactionsSkipped = 0

    for (const conn of connections) {
      const itemId = conn.pluggy_item_id as string
      let itemStatus = conn.status as string
      try {
        const item = await getItem(itemId)
        itemStatus = item.status
        await admin
          .from('financial_connections')
          .update({
            status: item.status,
            connector_id: item.connector?.id ?? null,
            connector_name: item.connector?.name ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conn.id)
      } catch {
        /* item fetch opcional */
      }

      const accounts = await listAccounts(itemId)
      for (const acc of accounts) {
        const ext = await upsertExternalAccount(admin, user.id, conn.id, acc)
        accountsSynced += 1

        for await (const tx of iterateAllTransactions(acc.id, { dateFrom, dateTo })) {
          const { data: existing } = await admin
            .from('transaction_imports')
            .select('id, transaction_id')
            .eq('user_id', user.id)
            .eq('provider', 'pluggy')
            .eq('external_id', tx.id)
            .maybeSingle()

          if (existing?.transaction_id) {
            transactionsSkipped += 1
            continue
          }

          const txId = newTransactionId()
          const date = tx.date.slice(0, 10)
          const row = {
            id: txId,
            user_id: user.id,
            name: tx.description?.trim() || 'Lançamento Pluggy',
            cat: mapCategory(tx.category?.description),
            amt: pluggyToFluxAmount(tx.amount, tx.type),
            date,
            account_id: ext.bank_account_id ?? null,
          }

          const { error: insErr } = await admin.from('transactions').insert(row)
          if (insErr) throw insErr

          await admin.from('transaction_imports').upsert(
            {
              user_id: user.id,
              provider: 'pluggy',
              external_id: tx.id,
              transaction_id: txId,
              external_account_id: ext.id,
            },
            { onConflict: 'user_id,provider,external_id' },
          )
          transactionsImported += 1
        }

        await admin
          .from('financial_external_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', ext.id)
      }

      await admin
        .from('financial_connections')
        .update({ last_synced_at: new Date().toISOString(), status: itemStatus })
        .eq('id', conn.id)
    }

    return json({
      ok: true,
      accountsSynced,
      transactionsImported,
      transactionsSkipped,
      dateFrom,
      dateTo: dateTo ?? null,
    })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro na sincronização Pluggy' }, 500)
  }
})

async function upsertExternalAccount(
  admin: ReturnType<typeof createClient>,
  userId: string,
  connectionId: string,
  acc: PluggyAccount,
) {
  const payload = {
    user_id: userId,
    connection_id: connectionId,
    pluggy_account_id: acc.id,
    account_kind: acc.type ?? 'BANK',
    account_subtype: acc.subtype ?? null,
    display_name: acc.name,
    balance: acc.balance ?? null,
    credit_limit: acc.creditData?.creditLimit ?? null,
    currency: acc.currencyCode ?? 'BRL',
    raw: acc as unknown as Record<string, unknown>,
    last_synced_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from('financial_external_accounts')
    .upsert(payload, { onConflict: 'user_id,pluggy_account_id' })
    .select('id, bank_account_id')
    .single()
  if (error) throw error
  return data as { id: string; bank_account_id: number | null }
}
