/**
 * Cálculo de rendimento e IR de investimentos.
 *
 * Portado fielmente de `legacy/index.html` (`calcInvestment`, ~L8617). Diferenças
 * intencionais: dinheiro em `Cents`, e a data de referência (`asOf`) é injetada
 * para tornar a função pura e testável (o legado usava `new Date()` interno).
 *
 * ⚠️ IR simplificado (documentado no ROADMAP): cripto/ações 15% sem faixas de
 * isenção; FII isento; renda fixa com tabela regressiva. Refinar depois.
 */
import { add, rate as applyRate, min as minCents, sub, type Cents, ZERO } from '@/domain/money'
import { daysBetween } from '@/domain/dates'
import { isMarketInvestmentType, type InvestmentType, type ISODate } from '@/domain/entities'

export interface MarketRates {
  /** CDI anual como fração (ex.: 0.1365 = 13,65% a.a.). */
  cdi: number
  /** IPCA anual como fração (ex.: 0.045 = 4,50% a.a.). */
  ipca: number
}

/** Fallbacks do legado quando o Banco Central está indisponível. */
export const DEFAULT_RATES: MarketRates = { cdi: 0.1365, ipca: 0.045 }

export interface InvestmentCalcInput {
  amount: Cents
  type: InvestmentType
  date: ISODate
  /** % do CDI (renda fixa indexada). */
  pct?: number | null
  /** Spread sobre o IPCA em pontos percentuais (Tesouro IPCA+). */
  spread?: number | null
  /** Rentabilidade anual estimada (%) para renda variável sem cotação. */
  yield?: number | null
  /** Preço unitário na compra (moeda do ativo). */
  buyPrice?: number | null
  /** Cotação atual (mesma moeda do ativo) para rentabilidade real. */
  currentPrice?: number | null
}

export interface InvestmentResult {
  days: number
  /** Rentabilidade bruta acumulada no período (fração). */
  grossRate: number
  /** Alíquota de IR sobre o rendimento (fração). */
  ir: number
  /** Rendimento bruto. */
  grossYield: Cents
  /** Rendimento líquido (após IR). */
  netYield: Cents
  /** Principal + rendimento bruto. */
  grossAmount: Cents
  /** Principal + rendimento líquido. */
  netAmount: Cents
}

/** Dias corridos de calendário desde a aplicação até `asOf` (nunca negativo). */
export function daysHeld(date: ISODate, asOf: Date): number {
  return Math.max(0, daysBetween(date, asOf))
}

/** Tabela regressiva de IR da renda fixa, por dias corridos. */
export function fixedIncomeIR(days: number): number {
  if (days <= 180) return 0.225
  if (days <= 360) return 0.2
  if (days <= 720) return 0.175
  return 0.15
}

/** Valor de mercado atual a partir do principal e preços de compra/cotação. */
export function marketValueFromPrices(amount: Cents, buyPrice: number, currentPrice: number): Cents {
  if (buyPrice <= 0 || currentPrice <= 0 || amount <= 0) return amount
  const qty = amount / 100 / buyPrice
  return Math.round(qty * currentPrice * 100) as Cents
}

/** Usa cotação real quando buyPrice + currentPrice estão disponíveis. */
export function usesMarketQuotes(input: Pick<InvestmentCalcInput, 'type' | 'buyPrice' | 'currentPrice'>): boolean {
  return (
    isMarketInvestmentType(input.type) &&
    input.buyPrice != null &&
    input.buyPrice > 0 &&
    input.currentPrice != null &&
    input.currentPrice > 0
  )
}

/** Rentabilidade bruta acumulada (juros compostos) no período. */
export function grossRateFor(
  input: Pick<InvestmentCalcInput, 'type' | 'pct' | 'spread' | 'yield' | 'amount' | 'buyPrice' | 'currentPrice'>,
  years: number,
  rates: MarketRates,
): number {
  if (usesMarketQuotes(input) && input.amount > 0) {
    const current = marketValueFromPrices(input.amount, input.buyPrice!, input.currentPrice!)
    return (current - input.amount) / input.amount
  }
  const { cdi, ipca } = rates
  switch (input.type) {
    case 'cdb':
    case 'lci':
    case 'selic':
      return Math.pow(1 + cdi * ((input.pct ?? 100) / 100), years) - 1
    case 'ipca':
      return Math.pow(1 + ipca + (input.spread ?? 0) / 100, years) - 1
    case 'poupanca': {
      // 70% da Selic (proxy: CDI) quando > 8,5% a.a.; senão 0,5% a.m. + IPCA.
      const poupRate = cdi > 0.085 ? 0.7 * cdi : 0.005 + ipca
      return Math.pow(1 + poupRate, years) - 1
    }
    case 'acoes':
    case 'acoeseua':
    case 'fii':
    case 'cripto':
    case 'outro':
      return Math.pow(1 + (input.yield ?? 10) / 100, years) - 1
    default:
      return 0
  }
}

/** Alíquota de IR conforme tipo, prazo e sinal do rendimento. */
export function irFor(type: InvestmentType, days: number, grossYield: Cents): number {
  if (type === 'lci' || type === 'poupanca' || type === 'fii') return 0
  if (type === 'acoes' || type === 'acoeseua' || type === 'cripto') {
    return grossYield > 0 ? 0.15 : 0
  }
  // Renda fixa (cdb, selic, ipca) e 'outro' → tabela regressiva.
  return fixedIncomeIR(days)
}

export function calcInvestment(
  input: InvestmentCalcInput,
  asOf: Date,
  rates: MarketRates = DEFAULT_RATES,
): InvestmentResult {
  const days = daysHeld(input.date, asOf)
  const years = days / 365
  const grossRate = grossRateFor({ ...input, amount: input.amount }, years, rates)
  const grossYield = applyRate(input.amount, grossRate)
  const ir = irFor(input.type, days, grossYield)
  const netYield = applyRate(grossYield, 1 - ir)
  return {
    days,
    grossRate,
    ir,
    grossYield,
    netYield,
    grossAmount: add(input.amount, grossYield),
    netAmount: add(input.amount, netYield),
  }
}

export interface RescuePlan {
  /** true = resgatou tudo (o investimento deixa de existir); false = parcial. */
  isFull: boolean
  /** Valor líquido creditado na conta de destino (nunca maior que o disponível). */
  creditAmount: Cents
  /** Novo principal do investimento após o resgate (0 se `isFull`). */
  remainingAmount: Cents
}

/**
 * Planeja o resgate (parcial ou total) de um investimento, a partir do valor
 * líquido atual (`netAmount` de `calcInvestment`). Portado de `legacy/index.html`
 * (`confirmRescue`): no resgate parcial, reduz o principal proporcionalmente
 * (`ratio = valor resgatado / valor líquido total`) — não apenas subtrai o valor
 * bruto, para manter o rendimento futuro proporcional ao que restou aplicado.
 */
export function planRescue(principal: Cents, netAmount: Cents, requestedAmount: Cents): RescuePlan {
  const creditAmount = minCents(requestedAmount, netAmount)
  if (netAmount <= 0 || creditAmount >= netAmount) {
    return { isFull: true, creditAmount: netAmount, remainingAmount: ZERO }
  }
  const ratio = creditAmount / netAmount
  const remainingAmount = sub(principal, Math.round(principal * ratio) as Cents)
  return { isFull: false, creditAmount, remainingAmount }
}
