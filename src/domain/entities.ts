/**
 * Modelos de domínio (camelCase, dinheiro em `Cents`, datas ISO "YYYY-MM-DD").
 *
 * A camada `data/` traduz as linhas do Supabase (snake_case, valores em reais)
 * para estes tipos e vice-versa. O domínio nunca vê snake_case nem float.
 */
import type { Cents } from './money'

/** Data no formato ISO "YYYY-MM-DD". */
export type ISODate = string

export type PaymentMethod = 'pix' | 'debito' | 'dinheiro' | 'ted' | 'credito' | 'boleto'

export type CardType = 'credito' | 'debito'

export type AccountType = 'corrente' | 'poupanca' | 'pagamento' | 'investimento'

export type IncomeFrequency = 'mensal' | 'quinzenal' | 'semanal' | 'variavel'

export type InvestmentType =
  | 'cdb'
  | 'lci'
  | 'selic'
  | 'ipca'
  | 'poupanca'
  | 'acoes'
  | 'acoeseua'
  | 'fii'
  | 'cripto'
  | 'outro'

export interface Transaction {
  id: number
  name: string
  /** Categoria (slug/rótulo). */
  cat: string
  /** Valor com sinal: negativo = gasto, positivo = receita. */
  amt: Cents
  date: ISODate
  accountId?: number | null
  /** Vínculo quando a transação nasce de um resgate/aporte de investimento. */
  investmentId?: number | null
  /** Vínculo quando nasce do pagamento de uma conta fixa. */
  billId?: number | null
  /** Chave da renda recorrente que gerou a transação. */
  incomeKey?: string | null
}

export interface CardBill {
  id: number
  cardId: number
  description: string
  amt: Cents
  date: ISODate
  /** Parcela retroativa já paga (não entra em faturas futuras). */
  pastPaid: boolean
  /** Lançamento recorrente (assinatura na fatura). */
  recurring: boolean
}

export interface Card {
  id: number
  name: string
  color: string
  limit: Cents
  /** Dia de fechamento da fatura (1..31). */
  closeDay: number
  /** Dia de vencimento da fatura (1..31). */
  dueDay: number
  type: CardType
  bills: CardBill[]
}

export interface Installment {
  id: number
  name: string
  total: Cents
  parcels: number
  paid: number
  icon: string
  color: string
  cardId?: number | null
}

export interface Subscription {
  id: number
  name: string
  amt: Cents
  /** Dia do mês da cobrança (1..31). */
  day: number
  icon: string
  color: string
  cardId?: number | null
}

export interface Goal {
  id: number
  name: string
  target: Cents
  saved: Cents
  icon: string
  color: string
  /** Prazo (bug do legado: era gravado como `dl`; unificamos em `deadline`). */
  deadline?: ISODate | null
}

export interface BankAccount {
  id: number
  name: string
  color: string
  accountType: AccountType
  initialBalance: Cents
}

export interface Income {
  id: number
  name: string
  amt: Cents
  freq: IncomeFrequency
  icon: string
  color: string
  accountId?: number | null
  /** Dias do mês em que o valor é recebido. */
  days: number[]
  /** Chaves "YYYY-MM-DD" já marcadas como recebidas (persistido — corrige bug). */
  received: string[]
  /** Se lança transação automaticamente ao chegar o período. */
  auto: boolean
}

export interface FixedBill {
  id: number
  name: string
  amt: Cents
  /** Dia de vencimento (1..31). */
  dueDay: number
  icon: string
  color: string
  category: string
  paid: boolean
  paidAt?: ISODate | null
  /** Valor efetivamente pago (corrige o drift de schema do legado). */
  paidAmount?: Cents | null
}

export interface Investment {
  id: number
  name: string
  bank: string
  /** Principal aplicado. */
  amount: Cents
  date: ISODate
  type: InvestmentType
  /** % do CDI (renda fixa indexada ao CDI). */
  pct?: number | null
  /** Spread sobre o IPCA (Tesouro IPCA+), em pontos percentuais. */
  spread?: number | null
  /** Rentabilidade estimada anual (%) para ativos de renda variável. */
  yield?: number | null
  ticker?: string | null
  accountId?: number | null
}

export interface Profile {
  id: string
  name: string
  phone?: string | null
  avatarUrl?: string | null
  color?: string | null
  emoji?: string | null
}

export type PlanTier = 'free' | 'pro'
export type PlanStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete'

export interface Plan {
  userId: string
  plan: PlanTier
  status: PlanStatus
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
  stripeSubId?: string | null
}
