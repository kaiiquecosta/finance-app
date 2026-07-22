/**
 * Lembretes: itens próximos do vencimento/recebimento. Portado de
 * `legacy/index.html` (checkReminders), como função pura que retorna dados
 * estruturados — cores, ícones e CTA ficam na UI.
 *
 * Correção de bug (decidido: corrigir com testes): o legado lia `goal.deadline`,
 * mas o dado era salvo como `dl`, então o lembrete de meta nunca disparava. Com a
 * entidade `Goal` usando `deadline`, aqui ele funciona.
 */
import { daysBetween, toISODate } from '@/domain/dates'
import { monthKey, receiptKey } from './income'
import type { Cents } from '@/domain/money'
import type { FixedBill, Goal, Income, Subscription } from '@/domain/entities'
import type { DerivedInstallment } from './installments'

export type ReminderKind = 'bill' | 'subscription' | 'income' | 'installment' | 'goal'
export type ReminderUrgency = 'urgent' | 'warn' | 'normal' | 'income'

export interface Reminder {
  id: string
  kind: ReminderKind
  urgency: ReminderUrgency
  daysUntil: number
  title: string
  amount?: Cents | null
  refId: string | number
}

export interface ReminderState {
  fixedBills: FixedBill[]
  subscriptions: Subscription[]
  incomes: Income[]
  installments: DerivedInstallment[]
  goals: Goal[]
}

function whenLabel(diff: number): string {
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return `em ${diff} dias`
}

/** Calcula os lembretes devidos em `asOf` (sem filtrar dispensados — isso é UI). */
export function computeReminders(state: ReminderState, asOf: Date): Reminder[] {
  const todayDay = asOf.getDate()
  const todayStr = toISODate(asOf)
  const mk = monthKey(asOf)
  const out: Reminder[] = []

  // Contas fixas: vencendo em 0..5 dias.
  for (const bill of state.fixedBills) {
    if (bill.paid) continue
    const diff = bill.dueDay - todayDay
    if (diff < 0 || diff > 5) continue
    out.push({
      id: `bill-${bill.id}-${todayStr}`,
      kind: 'bill',
      urgency: diff === 0 ? 'urgent' : diff === 1 ? 'warn' : 'normal',
      daysUntil: diff,
      title: `${bill.name} vence ${whenLabel(diff)}`,
      amount: bill.amt,
      refId: bill.id,
    })
  }

  // Assinaturas: cobrança em 0..2 dias.
  for (const sub of state.subscriptions) {
    const diff = sub.day - todayDay
    if (diff < 0 || diff > 2) continue
    out.push({
      id: `sub-${sub.id}-${todayStr}`,
      kind: 'subscription',
      urgency: diff === 0 ? 'urgent' : 'warn',
      daysUntil: diff,
      title: `${sub.name} cobra ${whenLabel(diff)}`,
      amount: sub.amt,
      refId: sub.id,
    })
  }

  // Rendas: a receber em 0..2 dias e ainda não recebidas.
  for (const inc of state.incomes) {
    for (const d of inc.days ?? []) {
      const diff = d - todayDay
      if (diff < 0 || diff > 2) continue
      if (inc.received.includes(receiptKey(mk, d))) continue
      out.push({
        id: `income-${inc.id}-${d}-${todayStr}`,
        kind: 'income',
        urgency: 'income',
        daysUntil: diff,
        title: `${inc.name} — ${diff === 0 ? 'dia de receber' : 'chega ' + whenLabel(diff)}`,
        amount: inc.amt,
        refId: inc.id,
      })
    }
  }

  // Parcelamentos: última parcela.
  for (const inst of state.installments) {
    if (inst.parcels - inst.paid === 1) {
      out.push({
        id: `inst-final-${inst.id}-${todayStr.slice(0, 7)}`,
        kind: 'installment',
        urgency: 'normal',
        daysUntil: 0,
        title: `Última parcela de "${inst.name}"`,
        amount: inst.parcelAmount,
        refId: inst.id,
      })
    }
  }

  // Metas: prazo em 0..7 dias e ainda não concluídas.
  for (const goal of state.goals) {
    if (!goal.deadline || goal.saved >= goal.target) continue
    const daysLeft = daysBetween(asOf, goal.deadline)
    if (daysLeft < 0 || daysLeft > 7) continue
    out.push({
      id: `goal-deadline-${goal.id}-${todayStr}`,
      kind: 'goal',
      urgency: daysLeft <= 1 ? 'urgent' : 'warn',
      daysUntil: daysLeft,
      title: `Meta "${goal.name}" ${daysLeft === 0 ? 'vence hoje' : 'em ' + daysLeft + ' dias'}`,
      amount: null,
      refId: goal.id,
    })
  }

  return out
}
