/**
 * Formatação para a borda de apresentação (UI). Dinheiro vem de `Money`.
 */
import { formatBRL } from '@/domain/money'
import { MONTHS } from '@/domain/categories'
import type { ISODate } from '@/domain/entities'

export { formatBRL }

const DAY_MS = 86_400_000

/** Data relativa: "hoje", "ontem" ou "dd/mês" (equivale ao `ago` do legado). */
export function formatRelativeDate(date: ISODate | Date, asOf: Date = new Date()): string {
  const dt = date instanceof Date ? date : new Date(date)
  const diff = Math.floor((asOf.getTime() - dt.getTime()) / DAY_MS)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/** "dd/mm/aaaa". */
export function formatDate(date: ISODate | Date): string {
  const dt = date instanceof Date ? date : new Date(date)
  return dt.toLocaleDateString('pt-BR')
}

/** "Mês/aaaa" abreviado a partir de índice de mês (0..11) e ano. */
export function formatMonthYear(monthIndex: number, year: number): string {
  return `${MONTHS[monthIndex] ?? '?'}/${year}`
}

/** Máscara de telefone BR: "(11) 91234-5678" (portado do legado `fmtPhone`). */
export function formatPhone(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 2) return v
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
}
