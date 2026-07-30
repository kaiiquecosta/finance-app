/**
 * Money — valores monetários representados como **centavos inteiros** (BRL).
 *
 * Regra do projeto: nunca usar `float` para dinheiro. Converta na borda de
 * entrada (`reais`/`parseBRL`), faça toda a matemática em `Cents` e formate
 * apenas na saída (`formatBRL`).
 *
 * `Cents` é um tipo nominal (branded) — o compilador impede somar centavos
 * com reais por engano. Use sempre os helpers deste módulo para operar.
 */

export type Cents = number & { readonly __brand: 'Cents' }

function assertFinite(n: number, ctx: string): void {
  if (!Number.isFinite(n)) throw new RangeError(`Money: valor não-finito em ${ctx}: ${n}`)
}

export const ZERO: Cents = 0 as Cents

/** Cria `Cents` a partir de um número já em centavos (arredonda p/ inteiro). */
export function cents(n: number): Cents {
  assertFinite(n, 'cents')
  return Math.round(n) as Cents
}

/** Converte reais (ex.: 1234.56) para centavos (123456). */
export function reais(n: number): Cents {
  assertFinite(n, 'reais')
  return Math.round(n * 100) as Cents
}

/** Converte `Cents` de volta para reais (número) — use só na borda. */
export function toReais(c: Cents): number {
  return c / 100
}

export function add(a: Cents, b: Cents): Cents {
  return (a + b) as Cents
}

export function sub(a: Cents, b: Cents): Cents {
  return (a - b) as Cents
}

export function sum(list: readonly Cents[]): Cents {
  return list.reduce<number>((acc, c) => acc + c, 0) as Cents
}

export function neg(c: Cents): Cents {
  return -c as Cents
}

export function abs(c: Cents): Cents {
  return Math.abs(c) as Cents
}

/** Multiplica por um escalar (ex.: nº de parcelas), arredondando ao centavo. */
export function mul(c: Cents, factor: number): Cents {
  assertFinite(factor, 'mul')
  return Math.round(c * factor) as Cents
}

/** Aplica uma taxa como fração (0.15 = 15%), arredondando ao centavo. */
export function rate(c: Cents, r: number): Cents {
  assertFinite(r, 'rate')
  return Math.round(c * r) as Cents
}

/** Divide em `parts` fatias iguais, distribuindo o resto centavo a centavo. */
export function allocate(c: Cents, parts: number): Cents[] {
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new RangeError(`Money.allocate: parts inválido: ${parts}`)
  }
  const base = Math.trunc(c / parts)
  let remainder = c - base * parts
  const step = remainder >= 0 ? 1 : -1
  remainder = Math.abs(remainder)
  return Array.from({ length: parts }, (_, i) => (base + (i < remainder ? step : 0)) as Cents)
}

/** Percentual de `part` sobre `whole` (0..100), seguro para `whole = 0`. */
export function percentOf(part: Cents, whole: Cents): number {
  if (whole === 0) return 0
  return (part / whole) * 100
}

export function isNegative(c: Cents): boolean {
  return c < 0
}

export function isZero(c: Cents): boolean {
  return c === 0
}

export function compare(a: Cents, b: Cents): number {
  return a - b
}

export function max(a: Cents, b: Cents): Cents {
  return Math.max(a, b) as Cents
}

export function min(a: Cents, b: Cents): Cents {
  return Math.min(a, b) as Cents
}

/** Limita `c` ao intervalo [lo, hi]. */
export function clamp(c: Cents, lo: Cents, hi: Cents): Cents {
  return Math.min(Math.max(c, lo), hi) as Cents
}

/**
 * Faz o parse de uma string monetária BR/US para `Cents`.
 * Aceita "3.000,50" (BR), "3000,50", "3000.50" (US), "R$ 1.234,56",
 * "3.000" (milhares BR), "1234" e números.
 */
export function parseBRL(input: string | number): Cents {
  if (typeof input === 'number') return reais(input)
  // Remove "R$", espacos e no-break spaces (U+00A0 e U+202F, usados no pt-BR).
  let s = input.trim().replace(/[R$\s\u00A0\u202F]/g, '')
  if (!s) return ZERO

  const negative = s.startsWith('-')
  if (negative) s = s.slice(1)

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // Quando ambos aparecem, o último separador é o decimal.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.') // BR: 3.000,50
    } else {
      s = s.replace(/,/g, '') // US: 3,000.50
    }
  } else if (hasComma) {
    s = s.replace(',', '.') // 3000,50
  } else if (hasDot) {
    const dotCount = s.split('.').length - 1
    const afterLast = s.slice(s.lastIndexOf('.') + 1)
    // Vários pontos, ou grupo final de 3 dígitos → milhares (ex.: "3.000").
    if (dotCount > 1 || afterLast.length === 3) {
      s = s.replace(/\./g, '')
    }
    // Caso contrário, ponto único é decimal (ex.: "3000.50").
  }

  const n = Number(s)
  if (!Number.isFinite(n)) return ZERO
  return reais(negative ? -n : n)
}

/** Formata `Cents` como BRL. `sign:true` prefixa "+" para positivos. */
export function formatBRL(c: Cents, opts: { sign?: boolean } = {}): string {
  const absValue = Math.abs(c) / 100
  const body = absValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (c < 0) return `-${body}`
  if (opts.sign && c > 0) return `+${body}`
  return body
}
