import type { Cents } from '@/domain/money'
import { formatBRL } from '@/domain/money'

export interface SaveToastOptions {
  msg: string
  color?: string
  title?: string
  icon?: string
  durationMs?: number
}

let pushToast: ((t: SaveToastOptions) => void) | null = null

export function registerToast(fn: (t: SaveToastOptions) => void) {
  pushToast = fn
}

export function unregisterToast() {
  pushToast = null
}

/** Toast de salvamento (topo central), como `showSaveToast` do legado. */
export function showSaveToast(
  msg: string,
  color = 'var(--green)',
  title?: string,
  icon?: string,
) {
  pushToast?.({ msg, color, title, icon })
}

/** Toast rápido após registrar transação. */
export function showTransactionToast(name: string, amt: Cents, catIcon: string) {
  const positive = amt >= 0
  pushToast?.({
    title: 'Transação registrada',
    msg: `${name} · ${formatBRL(amt, { sign: true })}`,
    color: positive ? 'var(--green)' : 'var(--red)',
    icon: catIcon,
  })
}
