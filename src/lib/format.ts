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

/** Data longa para cabeçalho da Visão geral (ex.: "quinta-feira, 6 de agosto de 2026"). */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
