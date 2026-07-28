/**
 * Parcelamentos: derivados dos lançamentos do cartão (padrão "(n/m)") somados
 * aos parcelamentos manuais. Portado de `legacy/index.html` (renderInst).
 */
import { cents, mul, sum, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import type { Card, CardBill, ISODate, Installment } from '@/domain/entities'

const PARCEL_RE = /\((\d+)\/(\d+)\)$/
const DEFAULT_COLOR = '#3b82f6'

export interface DerivedInstallment {
  id: string
  name: string
  total: Cents
  parcels: number
  paid: number
  parcelAmount: Cents
  icon: string
  /** Cor "crua" (default quando não personalizada); use `effectiveColor`. */
  color: string
  cardName?: string
  source: 'card' | 'manual'
}

/** Cor inferida pelo nome do item (regex do legado `getInstColor`). */
export function installmentColor(name: string): string {
  const n = (name || '').toLowerCase()
  if (/pizza|hamburguer|burger|ifood|rappi|restaurante|comida|lanche|sushi|padaria|mercado|supermercado|açougue|acougue|cacau|chocolate|sorvete|doce|bebida|café|cafe|bar/.test(n)) return '#f97316'
  if (/farmacia|remedio|médico|medico|saúde|saude|academia|gym|plano de saúde|dentist|hospital|exame/.test(n)) return '#22c55e'
  if (/macbook|iphone|ipad|samsung|notebook|computador|pc|monitor|teclado|mouse|headset|fone|tv|televisão|televisao|eletro|playstation|ps5|ps4|xbox|nintendo|switch|play|console|kindle|tablet|celular|smartphone|câmera|camera|impressora|ar.condicionado|geladeira|fogão|fogao|máquina|maquina|ventilador|microondas/.test(n)) return '#94a3b8'
  if (/roupa|camiseta|calça|calca|sapato|tênis|tenis|moda|loja|shopping|zara|renner|c&a|hering|nike|adidas|vestido|jaqueta/.test(n)) return '#ec4899'
  if (/viagem|passagem|hotel|airbnb|uber|99|taxi|combustivel|gasolina|pedágio|pedagio|carro|moto|ônibus|onibus|avião|aviao/.test(n)) return '#38bdf8'
  if (/curso|escola|faculdade|universidade|livro|estudo|aula|treinamento|certificado|udemy|alura|dio/.test(n)) return '#a78bfa'
  if (/netflix|spotify|amazon|prime|disney|youtube|apple|google|microsoft|adobe|canva|streaming/.test(n)) return '#6366f1'
  return DEFAULT_COLOR
}

/** Cor efetiva: usa a cor personalizada; senão infere pelo nome. */
export function effectiveColor(inst: Pick<DerivedInstallment, 'color' | 'name'>): string {
  return inst.color && inst.color !== DEFAULT_COLOR ? inst.color : installmentColor(inst.name)
}

/** Junta parcelamentos manuais + os derivados das faturas, só os em aberto. */
export function deriveInstallments(cards: Card[], manual: Installment[]): DerivedInstallment[] {
  const fromCards: DerivedInstallment[] = []

  for (const card of cards) {
    const groups = new Map<
      string,
      { name: string; parcels: number; paid: number; parcelAmount: Cents }
    >()
    for (const b of card.bills ?? []) {
      const match = b.description?.match(PARCEL_RE)
      if (!match) continue
      const name = b.description.replace(/ \(\d+\/\d+\)$/, '').trim()
      const parcels = parseInt(match[2], 10)
      const key = `${card.id}::${name}::${parcels}`
      let g = groups.get(key)
      if (!g) {
        g = { name, parcels, paid: 0, parcelAmount: b.amt }
        groups.set(key, g)
      }
      if (b.pastPaid) g.paid++
    }
    for (const [key, g] of groups) {
      fromCards.push({
        id: 'c' + key,
        name: g.name,
        total: mul(g.parcelAmount, g.parcels),
        parcels: g.parcels,
        paid: g.paid,
        parcelAmount: g.parcelAmount,
        icon: '💳',
        color: DEFAULT_COLOR,
        cardName: card.name,
        source: 'card',
      })
    }
  }

  const fromManual: DerivedInstallment[] = manual.map((i) => ({
    id: String(i.id),
    name: i.name,
    total: i.total,
    parcels: i.parcels,
    paid: i.paid,
    parcelAmount: cents(i.total / i.parcels),
    icon: i.icon || '💳',
    color: i.color || DEFAULT_COLOR,
    source: 'manual',
  }))

  return [...fromManual, ...fromCards].filter((i) => i.paid < i.parcels)
}

export interface InstallmentSummary {
  totalRemaining: Cents
  monthly: Cents
  count: number
}

/** Total ainda devido e comprometimento mensal do conjunto de parcelamentos. */
export function summarizeInstallments(list: DerivedInstallment[]): InstallmentSummary {
  const remaining = list.reduce((s, i) => s + (i.total - i.parcelAmount * i.paid), 0)
  const monthly = sum(list.map((i) => i.parcelAmount))
  return {
    totalRemaining: Math.max(remaining, 0) as Cents,
    monthly,
    count: list.length,
  }
}

/** Progresso de um parcelamento (parcelas restantes, % pago, valor da parcela). */
export function installmentProgress(inst: DerivedInstallment): {
  remaining: number
  pct: number
  parcel: Cents
} {
  return {
    remaining: Math.max(inst.parcels - inst.paid, 0),
    pct: Math.min((inst.paid / inst.parcels) * 100, 100),
    parcel: inst.parcelAmount,
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extrai o `cardId` do id de um parcelamento derivado de cartão ("c<id>::nome::N"). */
export function cardIdFromInstallmentId(id: string): number | null {
  if (!id.startsWith('c')) return null
  const n = Number(id.slice(1).split('::')[0])
  return Number.isFinite(n) ? n : null
}

export interface AdvancePlan {
  /** Faturas que serão marcadas como pagas e movidas para a data atual. */
  billsToAdvance: CardBill[]
  /** Valor total antecipado (limite liberado / a debitar da conta). */
  freedAmount: Cents
  /** Datas originais das parcelas antecipadas (para prévia dos meses). */
  months: ISODate[]
  /** Máximo de parcelas que dá para antecipar (deixa a do mês atual). */
  maxQty: number
}

/**
 * Planeja o adianto de `qty` parcelas de um parcelamento de cartão (puro).
 * Pega as parcelas futuras ainda em aberto, pula a do mês atual (não
 * antecipável) e marca as próximas `qty` como pagas, movendo-as para hoje —
 * é isso que as remove das faturas futuras e libera o limite.
 */
export function planAdvance(
  card: Card,
  installmentName: string,
  parcels: number,
  qty: number,
  asOf: Date,
): AdvancePlan {
  const re = new RegExp(`^${escapeRegExp(installmentName)} \\(\\d+/${parcels}\\)$`)
  const open = (card.bills ?? [])
    .filter((b) => b.description != null && re.test(b.description) && !b.pastPaid)
    .sort((a, b) => a.date.localeCompare(b.date))
  const advanceable = open.slice(1) // a primeira em aberto é a fatura atual
  const maxQty = advanceable.length
  const take = Math.max(0, Math.min(Math.floor(qty), maxQty))
  const selected = advanceable.slice(0, take)
  const today = toISODate(asOf)
  return {
    billsToAdvance: selected.map((b) => ({ ...b, pastPaid: true, date: today })),
    freedAmount: sum(selected.map((b) => b.amt)),
    months: selected.map((b) => b.date),
    maxQty,
  }
}
