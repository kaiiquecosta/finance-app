/**
 * Tipos das linhas do banco (snake_case, dinheiro em `numeric`/reais).
 * Correspondem 1:1 ao schema em supabase/migrations/0001_schema.sql.
 * A conversão para o domínio (camelCase, `Cents`) fica em mappers.ts.
 */

export interface ProfileRow {
  id: string
  name: string
  phone: string | null
  avatar_url: string | null
  color: string | null
  emoji: string | null
  is_admin?: boolean | null
  created_at?: string
}

export interface TransactionRow {
  id: number
  user_id: string
  name: string
  cat: string | null
  amt: number
  date: string
  account_id: number | null
  investment_id: number | null
  bill_id: number | null
  income_key: string | null
  is_new: boolean | null
  created_at?: string
}

export interface CardRow {
  id: number
  user_id: string
  name: string
  color: string | null
  card_limit: number
  close_day: number
  due_day: number
  card_type: string | null
  created_at?: string
}

export interface CardBillRow {
  id: number
  user_id: string
  card_id: number
  description: string
  amt: number
  date: string
  is_past_paid: boolean | null
  recurring: boolean | null
  created_at?: string
}

export interface InstallmentRow {
  id: number
  user_id: string
  name: string
  total: number
  parcels: number
  paid: number | null
  icon: string | null
  color: string | null
  card_id: number | null
  created_at?: string
}

export interface SubscriptionRow {
  id: number
  user_id: string
  name: string
  amt: number
  day: number
  icon: string | null
  color: string | null
  card_id: number | null
  created_at?: string
}

export interface GoalRow {
  id: number
  user_id: string
  name: string
  target: number
  saved: number | null
  icon: string | null
  color: string | null
  deadline: string | null
  created_at?: string
}

export interface BankAccountRow {
  id: number
  user_id: string
  name: string
  color: string | null
  account_type: string | null
  initial_balance: number | null
  created_at?: string
}

export interface IncomeRow {
  id: number
  user_id: string
  name: string
  amt: number
  freq: string | null
  icon: string | null
  color: string | null
  account_id: number | null
  days: number[] | null
  received: string[] | null
  auto: boolean | null
  created_at?: string
}

export interface FixedBillRow {
  id: number
  user_id: string
  name: string
  amt: number
  due_day: number
  icon: string | null
  color: string | null
  category: string | null
  paid: boolean | null
  paid_at: string | null
  paid_amount: number | null
  created_at?: string
}

export interface InvestmentRow {
  id: number
  user_id: string
  name: string
  bank: string | null
  amount: number
  date: string
  inv_type: string
  pct: number | null
  spread: number | null
  yield_pct: number | null
  ticker: string | null
  account_id: number | null
  created_at?: string
}

export interface PlanRow {
  user_id: string
  plan: string
  status: string
  trial_ends_at: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_sub_id: string | null
  updated_at?: string
}
