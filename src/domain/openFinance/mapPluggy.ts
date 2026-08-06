/**
 * Mapeamento Pluggy → domínio Flux (puro, testável).
 */
import { mul, reais, type Cents } from '@/domain/money'

export interface PluggyCategoryLike {
  description?: string | null
}

export interface PluggyTransactionLike {
  id: string
  description?: string | null
  amount: number
  type: 'CREDIT' | 'DEBIT'
  date: string
  category?: PluggyCategoryLike | null
}

/** Normaliza categoria Pluggy / Open Finance para slug do app. */
export function mapPluggyCategoryToSlug(description?: string | null): string {
  const d = (description ?? '').toLowerCase()
  if (!d) return 'outros'
  if (/mercado|supermercado|grocery/.test(d)) return 'mercado'
  if (/food|restaurant|aliment|ifood|delivery|lanche/.test(d)) return 'alimentação'
  if (/transport|uber|99|combust|gasolina|taxi/.test(d)) return 'transporte'
  if (/health|farmác|farmaci|médic|medic|academia/.test(d)) return 'saúde'
  if (/salary|salário|payroll|receita|income|deposit|pix receb/.test(d)) return 'receita'
  if (/invest|cdb|fii|ações|stock/.test(d)) return 'investimento'
  if (/streaming|netflix|spotify|disney/.test(d)) return 'streaming'
  if (/moradia|aluguel|condomínio|energia|água|internet|telefone/.test(d)) return 'moradia'
  if (/education|educação|curso|livro/.test(d)) return 'educação'
  return 'outros'
}

/** Converte valor Pluggy para Cents com sinal do Flux (gasto negativo). */
export function pluggyAmountToCents(amount: number, type: 'CREDIT' | 'DEBIT'): Cents {
  const abs = reais(Math.abs(Number(amount)))
  return type === 'CREDIT' ? abs : mul(abs, -1)
}

export function mapPluggyTransactionToDraft(tx: PluggyTransactionLike) {
  const sign = tx.type === 'CREDIT' ? 1 : -1
  return {
    externalId: tx.id,
    description: (tx.description ?? '').trim() || 'Lançamento importado',
    amountSigned: sign * Math.abs(Number(tx.amount)),
    date: tx.date.slice(0, 10),
    categorySlug: mapPluggyCategoryToSlug(tx.category?.description),
    cents: pluggyAmountToCents(tx.amount, tx.type),
  }
}
