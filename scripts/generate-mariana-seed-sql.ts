/**
 * Gera supabase/scripts/seed-persona-mariana.sql a partir da persona TypeScript.
 * Uso: npx vite-node scripts/generate-mariana-seed-sql.ts
 */
import { writeFileSync } from 'node:fs'
import { marianaDemoRestRows } from '../src/demo/marianaDemoRest'

const EMAIL = 'contatokaiiquecosta@gmail.com'

function sqlStr(s: string | null | undefined): string {
  if (s == null) return 'null'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlNum(n: number | null | undefined): string {
  if (n == null) return 'null'
  return String(n)
}

function sqlBool(b: boolean | null | undefined): string {
  if (b == null) return 'false'
  return b ? 'true' : 'false'
}

function sqlJson(v: unknown): string {
  return sqlStr(JSON.stringify(v ?? null))
}

function insertTable(
  table: string,
  columns: string[],
  rowObjs: Record<string, unknown>[],
  userIdExpr: string,
): string {
  if (!rowObjs.length) return ''
  const lines = rowObjs.map((row) => {
    const vals = columns.map((c) => {
      if (c === 'user_id') return userIdExpr
      const v = row[c]
      if (typeof v === 'boolean') return sqlBool(v)
      if (typeof v === 'number') return sqlNum(v)
      if (Array.isArray(v) || (v && typeof v === 'object')) return sqlJson(v)
      return sqlStr(v as string | null)
    })
    return `  (${vals.join(', ')})`
  })
  return `-- ${table}\nINSERT INTO public.${table} (${columns.join(', ')})\nVALUES\n${lines.join(',\n')}\nON CONFLICT (id) DO UPDATE SET\n  name = EXCLUDED.name,\n  amt = EXCLUDED.amt;\n\n`
}

const uid = `(SELECT id FROM auth.users WHERE email = ${sqlStr(EMAIL)} LIMIT 1)`

const rows = marianaDemoRestRows('00000000-0000-4000-8000-000000000001')

let sql = `-- Persona fictícia "Mariana Costa" — seed para conta real
-- Gerado por scripts/generate-mariana-seed-sql.ts
-- E-mail alvo: ${EMAIL}
-- Rode no SQL Editor do Supabase (service role). Ajuste o e-mail se necessário.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = ${sqlStr(EMAIL)}) THEN
    RAISE EXCEPTION 'Usuário não encontrado: ${EMAIL}';
  END IF;
END $$;

`

sql += insertTable(
  'bank_accounts',
  ['id', 'user_id', 'name', 'color', 'account_type', 'initial_balance'],
  rows.bank_accounts as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'cards',
  ['id', 'user_id', 'name', 'color', 'card_limit', 'close_day', 'due_day', 'card_type'],
  rows.cards as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'card_bills',
  ['id', 'user_id', 'card_id', 'description', 'amt', 'date', 'is_past_paid', 'recurring'],
  rows.card_bills as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'fixed_bills',
  [
    'id',
    'user_id',
    'name',
    'amt',
    'due_day',
    'icon',
    'color',
    'category',
    'paid',
    'paid_at',
    'paid_amount',
  ],
  rows.fixed_bills as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'subscriptions',
  ['id', 'user_id', 'name', 'amt', 'day', 'icon', 'color', 'card_id'],
  rows.subscriptions as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'installments',
  ['id', 'user_id', 'name', 'total', 'parcels', 'paid', 'icon', 'color', 'card_id'],
  rows.installments as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'goals',
  ['id', 'user_id', 'name', 'target', 'saved', 'icon', 'color', 'deadline'],
  rows.goals as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'incomes',
  ['id', 'user_id', 'name', 'amt', 'freq', 'icon', 'color', 'account_id', 'days', 'received', 'auto'],
  rows.incomes as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'investments',
  [
    'id',
    'user_id',
    'name',
    'bank',
    'amount',
    'date',
    'inv_type',
    'pct',
    'spread',
    'yield_pct',
    'ticker',
    'account_id',
  ],
  rows.investments as Record<string, unknown>[],
  uid,
)
sql += insertTable(
  'transactions',
  [
    'id',
    'user_id',
    'name',
    'cat',
    'amt',
    'date',
    'account_id',
    'investment_id',
    'bill_id',
    'income_key',
    'is_new',
  ],
  rows.transactions.map((t) => ({ ...t, is_new: false })) as Record<string, unknown>[],
  uid,
)

sql += `UPDATE public.profiles SET name = 'Mariana Costa', emoji = '👩‍💻', color = '#8b5cf6'
WHERE id = (SELECT id FROM auth.users WHERE email = ${sqlStr(EMAIL)} LIMIT 1);
`

const out = new URL('../supabase/scripts/seed-persona-mariana.sql', import.meta.url)
writeFileSync(out, sql, 'utf8')
console.log('Wrote', out.pathname)
