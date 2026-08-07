import { cents, type Cents } from '@/domain/money'
import { inferCategory, normalizeMerchantName } from '@/domain/categories'
import { normalizeSpokenNumbers } from '@/lib/spokenNumbers'
import { toISODate } from '@/domain/dates'
import type { ISODate } from '@/domain/entities'

export type ParsedFinanceMessage = {
  kind: 'expense' | 'income'
  name: string
  amount: Cents
  cat: string
  date: ISODate
}

const INCOME_VERB =
  /\b(recebi|ganhei|entrada|sal[aá]rio|dep[oó]sito|credito|cr[eé]dito|pix\s+recebido|earned|received|got\s+paid|income|salary|made)\b/i

const EXPENSE_VERB =
  /\b(gastei|gastar|paguei|pagar|comprei|comprar|gasto|sa[ií]da|debito|d[eé]bito|spent|spend|paid|pay|bought|buy|purchased|purchase|cost(?:ed)?)\b/i

const FILLER =
  /\b(i|just|acabei\s+de|agora|hoje|please|plz|throw\s+it(?:\s+in)?|register(?:\s+it)?|add(?:\s+it)?|lan[cç]a(?:r)?|coloca(?:r)?|put(?:\s+it)?|and)\b/gi

/** Interpreta frases curtas ou naturais (PT/EN): valor + descrição + gasto/receita. */
export function parseFinanceMessage(
  raw: string,
  asOf: Date = new Date(),
): { ok: true; data: ParsedFinanceMessage } | { ok: false; error: string } {
  let text = normalizeSpokenNumbers(raw.trim())
  if (!text) {
    return { ok: false, error: 'Digite ou fale algo como: 10 reais coxinha · I spent R$10 on coxinha' }
  }

  let kind = detectKind(text)
  if (/^\+\s*/.test(text)) {
    kind = 'income'
    text = text.replace(/^\+\s*/, '').trim()
  } else if (/^-\s*/.test(text)) {
    kind = 'expense'
    text = text.replace(/^-\s*/, '').trim()
  }

  const amountResult = extractAmount(text)
  if (!amountResult) {
    return {
      ok: false,
      error: 'Não achei o valor. Ex.: 10 reais coxinha · spent R$10 on coxinha · earned 500',
    }
  }

  let name = extractDescription(amountResult.rest)
  if (!name) name = kind === 'income' ? 'Receita' : 'Gasto'

  const cat = kind === 'income' ? 'receita' : inferCategory(name)
  if (kind === 'expense') name = normalizeMerchantName(name)
  const date = toISODate(asOf)

  if (amountResult.cents <= 0) {
    return { ok: false, error: 'O valor precisa ser maior que zero.' }
  }

  return {
    ok: true,
    data: { kind, name: capitalizeName(name), amount: amountResult.cents, cat, date },
  }
}

function detectKind(text: string): 'expense' | 'income' {
  const incomeAt = text.search(INCOME_VERB)
  const expenseAt = text.search(EXPENSE_VERB)
  const hasIncome = incomeAt >= 0
  const hasExpense = expenseAt >= 0

  if (hasIncome && !hasExpense) return 'income'
  if (hasExpense && !hasIncome) return 'expense'
  if (hasIncome && hasExpense) {
    return incomeAt <= expenseAt ? 'income' : 'expense'
  }
  return 'expense'
}

function extractDescription(rest: string): string {
  let s = rest
  s = s.replace(INCOME_VERB, ' ')
  s = s.replace(EXPENSE_VERB, ' ')
  s = s.replace(FILLER, ' ')

  const onMatch = /\b(?:on|for|at|with|in|com|em|no|na|de|do|da|por|para)\s+(.+)$/i.exec(s)
  if (onMatch?.[1]) {
    return cleanupDescription(onMatch[1])
  }

  return cleanupDescription(s)
}

function extractAmount(text: string): { cents: Cents; rest: string } | null {
  const patterns: { re: RegExp; pick: (m: RegExpMatchArray) => string }[] = [
    {
      re: /(?:r\$?\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)/i,
      pick: (m) => m[1],
    },
    {
      re: /(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|rs\b|r\$|dollars?|bucks?)/i,
      pick: (m) => m[1],
    },
    {
      re: /\b(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)\b/i,
      pick: (m) => m[1],
    },
    {
      re: /(?:no|na|de|por|em|on|for)\s+(\d+(?:[.,]\d{1,2})?)(?:\s|$)/i,
      pick: (m) => m[1],
    },
    {
      re: /(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?:\s|$)/,
      pick: (m) => m[1],
    },
  ]

  for (const { re, pick } of patterns) {
    const m = text.match(re)
    if (!m || m.index == null) continue
    const parsed = parseMoneyToken(pick(m))
    if (parsed == null || parsed <= 0) continue
    const rest = (text.slice(0, m.index) + text.slice(m.index + m[0].length)).trim()
    return { cents: parsed, rest }
  }
  return null
}

function parseMoneyToken(token: string): Cents | null {
  const t = token.trim().replace(/\s/g, '')
  if (!t) return null
  const br = /^(\d{1,3}(?:\.\d{3})*),(\d{1,2})$/.exec(t)
  if (br) {
    const intPart = br[1].replace(/\./g, '')
    return cents(Number(intPart) * 100 + Number(br[2].padEnd(2, '0').slice(0, 2)))
  }
  const simple = t.replace(',', '.')
  const n = Number(simple)
  if (Number.isNaN(n) || n <= 0) return null
  return cents(Math.round(n * 100))
}

function cleanupDescription(s: string): string {
  const cleaned = s
    .replace(/\b(reais|real|r\$|rs|dollars?|bucks?)\b/gi, ' ')
    .replace(/\b(on|for|at|with|in|the|a|an|no|na|de|do|da|em|por|para|com)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return collapseRepeatedSpeech(cleaned)
}

/** Remove eco típico do ditado (palavras ou frase inteira repetida). */
function collapseRepeatedSpeech(s: string): string {
  const words = s.split(/\s+/).filter(Boolean)
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2
    const a = words.slice(0, half).join(' ')
    const b = words.slice(half).join(' ')
    if (a.toLowerCase() === b.toLowerCase()) return a
  }
  const out: string[] = []
  for (const w of words) {
    const prev = out[out.length - 1]
    if (prev && prev.toLowerCase() === w.toLowerCase()) continue
    out.push(w)
  }
  return out.join(' ')
}

function capitalizeName(name: string): string {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1)
}
