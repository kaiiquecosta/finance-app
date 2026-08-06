/**
 * Utilitários de data de calendário.
 *
 * As datas do app são calendárias ("YYYY-MM-DD"), sem horário. Usar
 * `new Date("2026-03-10")` interpreta como UTC e, com `getDate()` local, pode
 * deslocar o dia (bug latente do legado perto da virada de mês). Aqui tratamos
 * sempre como data LOCAL à meia-noite.
 */
const DAY_MS = 86_400_000
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parseia "YYYY-MM-DD" como data local à meia-noite. Outros formatos: `new Date`. */
export function parseISODate(input: string | Date): Date {
  if (input instanceof Date) return input
  const m = ISO_DATE_RE.exec(input)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(input)
}

/** Meia-noite local do dia de `d`. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Dias corridos de calendário entre `from` e `to` (pode ser negativo). */
export function daysBetween(from: string | Date, to: string | Date): number {
  const a = startOfDay(parseISODate(from)).getTime()
  const b = startOfDay(parseISODate(to)).getTime()
  return Math.round((b - a) / DAY_MS)
}

/** Formata um `Date` como "YYYY-MM-DD" local. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Adiciona `n` meses a (month, year), normalizando (month 0..11). */
export function addMonths(month: number, year: number, n: number): { month: number; year: number } {
  let m = month + n
  let y = year
  while (m < 0) {
    m += 12
    y--
  }
  while (m > 11) {
    m -= 12
    y++
  }
  return { month: m, year: y }
}

/**
 * Soma meses a uma data ISO preservando o dia (limitado ao último dia do mês alvo).
 * Evita que 31/03 + 1 mês vire 01/05 por overflow do `Date`.
 */
export function addMonthsToISODate(isoDate: string, months: number): string {
  const d = parseISODate(isoDate)
  const { month, year } = addMonths(d.getMonth(), d.getFullYear(), months)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(d.getDate(), lastDay)
  return toISODate(new Date(year, month, day))
}
