/**
 * Converte a persona Mariana em linhas REST (snake_case) para mocks E2E / SQL.
 */
import * as map from '@/data/mappers'
import { buildMarianaFinanceData } from '@/demo/personaMariana'
import type {
  CardBillRow,
  CardRow,
  FixedBillRow,
  GoalRow,
  IncomeRow,
  InstallmentRow,
  InvestmentRow,
  SubscriptionRow,
  TransactionRow,
  BankAccountRow,
} from '@/data/types'

export interface MarianaDemoRestBundle {
  transactions: TransactionRow[]
  cards: CardRow[]
  card_bills: CardBillRow[]
  installments: InstallmentRow[]
  subscriptions: SubscriptionRow[]
  goals: GoalRow[]
  bank_accounts: BankAccountRow[]
  incomes: IncomeRow[]
  fixed_bills: FixedBillRow[]
  investments: InvestmentRow[]
}

export function marianaDemoRestRows(userId: string): MarianaDemoRestBundle {
  const data = buildMarianaFinanceData()
  const card_bills: CardBillRow[] = []
  for (const card of data.cards) {
    for (const bill of card.bills) {
      card_bills.push(map.toCardBillRow(bill, userId))
    }
  }
  return {
    transactions: data.transactions.map((t) => map.toTransactionRow(t, userId)),
    cards: data.cards.map((c) => map.toCardRow(c, userId)),
    card_bills,
    installments: data.installments.map((i) => map.toInstallmentRow(i, userId)),
    subscriptions: data.subscriptions.map((s) => map.toSubscriptionRow(s, userId)),
    goals: data.goals.map((g) => map.toGoalRow(g, userId)),
    bank_accounts: data.bankAccounts.map((a) => map.toBankAccountRow(a, userId)),
    incomes: data.incomes.map((i) => map.toIncomeRow(i, userId)),
    fixed_bills: data.fixedBills.map((b) => map.toFixedBillRow(b, userId)),
    investments: data.investments.map((i) => map.toInvestmentRow(i, userId)),
  }
}
