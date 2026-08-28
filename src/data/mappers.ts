/**
 * Conversão entre linhas do banco (snake_case, reais) e entidades de domínio
 * (camelCase, `Cents`). Toda a conversão de dinheiro acontece AQUI, na borda:
 * o banco guarda `numeric` (reais) e o domínio opera em centavos inteiros.
 */
import { reais, toReais, type Cents } from '@/domain/money'
import type {
  AccountType,
  BankAccount,
  Card,
  CardBill,
  FixedBill,
  Goal,
  Income,
  IncomeFrequency,
  Installment,
  Investment,
  InvestmentType,
  Plan,
  PlanStatus,
  PlanTier,
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

const money = (n: number | null | undefined): Cents => reais(n ?? 0)

// ── Profiles / Plans (somente leitura no cliente) ───────────────────────────
export function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    avatarUrl: r.avatar_url,
    color: r.color,
    emoji: r.emoji,
    isAdmin: r.is_admin ?? false,
  }
}

export function rowToPlan(r: PlanRow): Plan {
  return {
    userId: r.user_id,
    plan: r.plan as PlanTier,
    status: r.status as PlanStatus,
    trialEndsAt: r.trial_ends_at,
    currentPeriodEnd: r.current_period_end,
    stripeSubId: r.stripe_sub_id,
  }
}

// ── Transactions ────────────────────────────────────────────────────────────
export function rowToTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    name: r.name,
    cat: r.cat ?? 'outros',
    amt: money(r.amt),
    date: r.date,
    accountId: r.account_id,
    investmentId: r.investment_id,
    billId: r.bill_id,
    incomeKey: r.income_key,
  }
}

export function toTransactionRow(t: Transaction, userId: string): TransactionRow {
  return {
    id: t.id,
    user_id: userId,
    name: t.name,
    cat: t.cat,
    amt: toReais(t.amt),
    date: t.date,
    account_id: t.accountId ?? null,
    investment_id: t.investmentId ?? null,
    bill_id: t.billId ?? null,
    income_key: t.incomeKey ?? null,
    is_new: false,
  }
}

// ── Cards / Card bills ──────────────────────────────────────────────────────
export function rowToCard(r: CardRow, bills: CardBill[] = []): Card {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? '#8b5cf6',
    limit: money(r.card_limit),
    closeDay: r.close_day,
    dueDay: r.due_day,
    type: /d[ée]b/i.test(r.card_type ?? '') ? 'debito' : 'credito',
    bills,
  }
}

export function toCardRow(c: Card, userId: string): Omit<CardRow, 'created_at'> {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    card_limit: toReais(c.limit),
    close_day: c.closeDay,
    due_day: c.dueDay,
    card_type: c.type === 'debito' ? 'Débito' : 'Crédito',
  }
}

export function rowToCardBill(r: CardBillRow): CardBill {
  return {
    id: r.id,
    cardId: r.card_id,
    description: r.description,
    amt: money(r.amt),
    date: r.date,
    pastPaid: Boolean(r.is_past_paid),
    recurring: Boolean(r.recurring),
    externalId: r.external_id,
  }
}

export function toCardBillRow(b: CardBill, userId: string): Omit<CardBillRow, 'created_at'> {
  return {
    id: b.id,
    user_id: userId,
    card_id: b.cardId,
    description: b.description,
    amt: toReais(b.amt),
    date: b.date,
    is_past_paid: b.pastPaid,
    recurring: b.recurring,
    external_id: b.externalId ?? null,
  }
}

// ── Installments ─────────────────────────────────────────────────────────────
export function rowToInstallment(r: InstallmentRow): Installment {
  return {
    id: r.id,
    name: r.name,
    total: money(r.total),
    parcels: r.parcels,
    paid: r.paid ?? 0,
    icon: r.icon ?? '💳',
    color: r.color ?? '#3b82f6',
    cardId: r.card_id,
  }
}

export function toInstallmentRow(i: Installment, userId: string): Omit<InstallmentRow, 'created_at'> {
  return {
    id: i.id,
    user_id: userId,
    name: i.name,
    total: toReais(i.total),
    parcels: i.parcels,
    paid: i.paid,
    icon: i.icon,
    color: i.color,
    card_id: i.cardId ?? null,
  }
}

// ── Subscriptions ────────────────────────────────────────────────────────────
export function rowToSubscription(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    name: r.name,
    amt: money(r.amt),
    day: r.day,
    icon: r.icon ?? '📱',
    color: r.color ?? '#8b5cf6',
    cardId: r.card_id,
  }
}

export function toSubscriptionRow(s: Subscription, userId: string): Omit<SubscriptionRow, 'created_at'> {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    amt: toReais(s.amt),
    day: s.day,
    icon: s.icon,
    color: s.color,
    card_id: s.cardId ?? null,
  }
}

// ── Goals ─────────────────────────────────────────────────────────────────
export function rowToGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    name: r.name,
    target: money(r.target),
    saved: money(r.saved),
    icon: r.icon ?? '🎯',
    color: r.color ?? '#22c55e',
    deadline: r.deadline,
  }
}

export function toGoalRow(g: Goal, userId: string): Omit<GoalRow, 'created_at'> {
  return {
    id: g.id,
    user_id: userId,
    name: g.name,
    target: toReais(g.target),
    saved: toReais(g.saved),
    icon: g.icon,
    color: g.color,
    deadline: g.deadline ?? null,
  }
}

// ── Bank accounts ────────────────────────────────────────────────────────────
export function rowToBankAccount(r: BankAccountRow): BankAccount {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? '#64748b',
    accountType: (r.account_type ?? 'corrente') as AccountType,
    initialBalance: money(r.initial_balance),
  }
}

export function toBankAccountRow(a: BankAccount, userId: string): Omit<BankAccountRow, 'created_at'> {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    color: a.color,
    account_type: a.accountType,
    initial_balance: toReais(a.initialBalance),
  }
}

// ── Incomes ─────────────────────────────────────────────────────────────────
export function rowToIncome(r: IncomeRow): Income {
  return {
    id: r.id,
    name: r.name,
    amt: money(r.amt),
    freq: (r.freq ?? 'mensal') as IncomeFrequency,
    icon: r.icon ?? '💰',
    color: r.color ?? '#22c55e',
    accountId: r.account_id,
    days: r.days ?? [],
    received: r.received ?? [],
    auto: r.auto ?? true,
  }
}

export function toIncomeRow(i: Income, userId: string): Omit<IncomeRow, 'created_at'> {
  return {
    id: i.id,
    user_id: userId,
    name: i.name,
    amt: toReais(i.amt),
    freq: i.freq,
    icon: i.icon,
    color: i.color,
    account_id: i.accountId ?? null,
    days: i.days,
    received: i.received,
    auto: i.auto,
  }
}

// ── Fixed bills ─────────────────────────────────────────────────────────────
export function rowToFixedBill(r: FixedBillRow): FixedBill {
  return {
    id: r.id,
    name: r.name,
    amt: money(r.amt),
    dueDay: r.due_day,
    icon: r.icon ?? '📄',
    color: r.color ?? '#3b82f6',
    category: r.category ?? 'Outros',
    paid: Boolean(r.paid),
    paidAt: r.paid_at,
    paidAmount: r.paid_amount != null ? reais(r.paid_amount) : null,
  }
}

export function toFixedBillRow(b: FixedBill, userId: string): Omit<FixedBillRow, 'created_at'> {
  return {
    id: b.id,
    user_id: userId,
    name: b.name,
    amt: toReais(b.amt),
    due_day: b.dueDay,
    icon: b.icon,
    color: b.color,
    category: b.category,
    paid: b.paid,
    paid_at: b.paidAt ?? null,
    paid_amount: b.paidAmount != null ? toReais(b.paidAmount) : null,
  }
}

// ── Investments ─────────────────────────────────────────────────────────────
export function rowToInvestment(r: InvestmentRow): Investment {
  return {
    id: r.id,
    name: r.name,
    bank: r.bank ?? '',
    amount: money(r.amount),
    date: r.date,
    type: r.inv_type as InvestmentType,
    pct: r.pct,
    spread: r.spread,
    yield: r.yield_pct,
    ticker: r.ticker,
    accountId: r.account_id,
  }
}

export function toInvestmentRow(i: Investment, userId: string): Omit<InvestmentRow, 'created_at'> {
  return {
    id: i.id,
    user_id: userId,
    name: i.name,
    bank: i.bank,
    amount: toReais(i.amount),
    date: i.date,
    inv_type: i.type,
    pct: i.pct ?? 0,
    spread: i.spread ?? 0,
    yield_pct: i.yield ?? 0,
    ticker: i.ticker ?? null,
    account_id: i.accountId ?? null,
  }
}
