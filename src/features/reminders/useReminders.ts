/**
 * Lembretes visíveis: calcula com `computeReminders` (domínio) e filtra os
 * que o usuário já dispensou (persistido em localStorage, com poda automática
 * de dispensas que não correspondem a nenhum lembrete atual).
 */
import { useEffect, useState } from 'react'
import { computeReminders } from '@/domain/calc/reminders'
import { deriveInstallments } from '@/domain/calc/installments'
import type { FinanceData } from '@/data/api'

const STORAGE_KEY = 'finance_reminders_dismissed'

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeDismissed(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage indisponível (modo privado, quota) — dispensa não persiste, tudo bem.
  }
}

export function useReminders(data: FinanceData | undefined, asOf: Date = new Date()) {
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed())

  const all = data
    ? computeReminders(
        {
          fixedBills: data.fixedBills,
          subscriptions: data.subscriptions,
          incomes: data.incomes,
          installments: deriveInstallments(data.cards, data.installments),
          goals: data.goals,
        },
        asOf,
      )
    : []

  // Poda dispensas que não correspondem a nenhum lembrete atual (evita
  // crescimento indefinido e "esquece" dispensas de dias/lembretes antigos).
  useEffect(() => {
    const currentIds = new Set(all.map((r) => r.id))
    setDismissed((prev) => {
      const pruned = prev.filter((id) => currentIds.has(id))
      if (pruned.length === prev.length) return prev
      writeDismissed(pruned)
      return pruned
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const visible = all.filter((r) => !dismissed.includes(r.id))

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = [...prev, id]
      writeDismissed(next)
      return next
    })
  }

  return { reminders: visible, dismiss }
}
