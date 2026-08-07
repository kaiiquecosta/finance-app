import { normalizeSpokenNumbers } from '@/lib/spokenNumbers'

/** Junta fragmentos de fala sem colar palavras nem repetir o mesmo trecho final. */
export function appendSpeechFragment(current: string, next: string): string {
  const n = next.replace(/\s+/g, ' ').trim()
  if (!n) return current.replace(/\s+/g, ' ').trim()
  const c = current.replace(/\s+/g, ' ').trim()
  if (!c) return n
  if (c === n || c.endsWith(` ${n}`) || c.endsWith(n)) return c
  if (n.startsWith(c)) return n
  const cLower = c.toLowerCase()
  const nLower = n.toLowerCase()
  if (nLower.startsWith(cLower) && n.length > c.length) return n
  return `${c} ${n}`.replace(/\s+/g, ' ').trim()
}

/**
 * Evita que uma hipótese interim mais curta apague número ou início já reconhecido.
 */
export function stabilizeDictationLine(previous: string, candidate: string): string {
  const prev = previous.replace(/\s+/g, ' ').trim()
  const cand = candidate.replace(/\s+/g, ' ').trim()
  if (!cand) return prev
  if (!prev) return cand

  const withPrefix = mergeKeepingLeadingAmount(prev, cand)
  if (withPrefix) return withPrefix

  if (cand.length >= prev.length) {
    if (cand.toLowerCase().startsWith(prev.toLowerCase())) return cand
    if (prev.toLowerCase().startsWith(cand.toLowerCase())) return prev
    return cand
  }

  const p = prev.toLowerCase()
  const c = cand.toLowerCase()
  if (p.endsWith(c) || p.includes(` ${c}`)) return prev

  return prev
}

function mergeKeepingLeadingAmount(prev: string, cand: string): string | null {
  if (!/\d/.test(prev)) return null
  const digitPrefix = prev.match(/^(\d[\d\s.,]*)/)?.[1]?.trim()
  if (!digitPrefix) return null

  const candLower = cand.toLowerCase()
  if (candLower.startsWith(digitPrefix.toLowerCase())) return null

  const candDigits = cand.match(/^(\d[\d\s.,]*)/)?.[1]?.trim()
  if (candDigits) return null

  const restPrev = prev.slice(digitPrefix.length).trim()
  const restLower = restPrev.toLowerCase()

  if (restLower && (candLower.startsWith(restLower) || candLower.includes(restLower))) {
    return `${digitPrefix} ${cand}`.replace(/\s+/g, ' ').trim()
  }

  if (!/\d/.test(cand)) {
    return `${digitPrefix} ${cand}`.replace(/\s+/g, ' ').trim()
  }

  return null
}

export function polishDictationLine(previous: string, candidate: string): string {
  return stabilizeDictationLine(previous, normalizeSpokenNumbers(candidate))
}

type ResultSlice = {
  isFinal: boolean
  transcript: string
}

/** Monta a linha atual a partir do evento Web Speech (sem duplicar índices). */
export function lineFromSpeechResults(
  results: readonly ResultSlice[],
  resultIndex: number,
  sessionFinal: string,
): { sessionFinal: string; line: string } {
  let finals = sessionFinal
  for (let i = resultIndex; i < results.length; i++) {
    const piece = results[i].transcript.replace(/\s+/g, ' ').trim()
    if (!piece) continue
    if (results[i].isFinal) {
      finals = appendSpeechFragment(finals, piece)
    }
  }

  let interim = ''
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].isFinal) continue
    interim = results[i].transcript.replace(/\s+/g, ' ').trim()
    break
  }

  const line = appendSpeechFragment(finals, interim)
  return { sessionFinal: finals, line }
}
