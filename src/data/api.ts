/**
 * Acesso a dados no Supabase. Substitui o `loadUserData`/`autosave` do legado:
 * leitura agregada por usuário + escrita por upsert idempotente (onConflict: id).
 */
import { supabase } from './supabase'
import * as map from './mappers'
import type {
  BankAccount,
  Card,
  FixedBill,
  Goal,
  Income,
  Installment,
  Investment,
  Plan,
  Profile,
  Subscription,
  Transaction,
} from '@/domain/entities'
import type {
  BankAccountRow,
  CardBillRow,
  CardRow,
  FixedBillRow,
  GoalRow,
  IncomeRow,
  InstallmentRow,
  InvestmentRow,
  PlanRow,
  ProfileRow,
  SubscriptionRow,
  TransactionRow,
} from './types'

export interface FinanceData {
  transactions: Transaction[]
  cards: Card[]
  installments: Installment[]
  subscriptions: Subscription[]
  goals: Goal[]
  bankAccounts: BankAccount[]
  incomes: Income[]
  fixedBills: FixedBill[]
  investments: Investment[]
}

async function selectAll<T>(table: string, userId: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as T[]
}

/** Carrega todos os dados do usuário e monta as entidades de domínio. */
export async function fetchFinanceData(userId: string): Promise<FinanceData> {
  const [txRows, cardRows, billRows, instRows, subRows, goalRows, accRows, incRows, fbRows, invRows] =
    await Promise.all([
      selectAll<TransactionRow>('transactions', userId),
      selectAll<CardRow>('cards', userId),
      selectAll<CardBillRow>('card_bills', userId),
      selectAll<InstallmentRow>('installments', userId),
      selectAll<SubscriptionRow>('subscriptions', userId),
      selectAll<GoalRow>('goals', userId),
      selectAll<BankAccountRow>('bank_accounts', userId),
      selectAll<IncomeRow>('incomes', userId),
      selectAll<FixedBillRow>('fixed_bills', userId),
      selectAll<InvestmentRow>('investments', userId),
    ])

  const billsByCard = new Map<number, ReturnType<typeof map.rowToCardBill>[]>()
  for (const r of billRows) {
    const bill = map.rowToCardBill(r)
    const arr = billsByCard.get(bill.cardId) ?? []
    arr.push(bill)
    billsByCard.set(bill.cardId, arr)
  }

  return {
    transactions: txRows.map(map.rowToTransaction),
    cards: cardRows.map((c) => map.rowToCard(c, billsByCard.get(c.id) ?? [])),
    installments: instRows.map(map.rowToInstallment),
    subscriptions: subRows.map(map.rowToSubscription),
    goals: goalRows.map(map.rowToGoal),
    bankAccounts: accRows.map(map.rowToBankAccount),
    incomes: incRows.map(map.rowToIncome),
    fixedBills: fbRows.map(map.rowToFixedBill),
    investments: invRows.map(map.rowToInvestment),
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? map.rowToProfile(data as ProfileRow) : null
}

export async function fetchPlan(userId: string): Promise<Plan | null> {
  const { data, error } = await supabase.from('plans').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? map.rowToPlan(data as PlanRow) : null
}

/** Atualiza nome e telefone do perfil. */
export async function updateProfileInfo(
  userId: string,
  info: { name: string; phone: string | null },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(info).eq('id', userId)
  if (error) throw error
}

/**
 * Define o avatar: uma imagem (data URL base64) OU um emoji — nunca os dois,
 * então escolher um limpa o outro (mesmo comportamento do legado).
 */
export async function updateProfileAvatar(
  userId: string,
  avatar: { avatarUrl: string; emoji: null } | { avatarUrl: null; emoji: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatar.avatarUrl, emoji: avatar.emoji })
    .eq('id', userId)
  if (error) throw error
}

// ── Escrita (upsert idempotente / delete) ────────────────────────────────────
export async function upsertRows(table: string, rows: object[]): Promise<void> {
  if (!rows.length) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteRow(table: string, id: number): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
