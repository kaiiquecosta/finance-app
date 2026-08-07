import { normalizeSpokenNumbers } from '@/lib/spokenNumbers'

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** No celular, uma frase por vez costuma capturar valor + descrição melhor que modo contínuo. */
export function useSingleUtteranceDictation(): boolean {
  return isAppleMobile() || isAndroid()
}

/** Safari/WebKit costuma falhar com várias hipóteses no ditado. */
export function speechRecognitionMaxAlternatives(): number {
  if (typeof navigator === 'undefined') return 3
  const ua = navigator.userAgent
  if (/Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg/i.test(ua)) return 1
  return 3
}

export function getDictationListeningHint(): string {
  return 'Fale o valor primeiro, depois o item. Ex.: “10 reais coxinha”. Toque 🎤 para parar e ↑ para enviar.'
}

/** Escolhe a melhor hipótese para gastos (valor + descrição em português). */
export function pickRecognitionTranscript(
  alternatives: ReadonlyArray<{ transcript?: string } | undefined>,
): string {
  const texts = alternatives
    .map((a) => a?.transcript?.replace(/\s+/g, ' ').trim())
    .filter((t): t is string => Boolean(t))
  if (!texts.length) return ''

  let best = texts[0]
  let bestScore = scoreFinanceTranscript(best)
  for (let i = 1; i < texts.length; i++) {
    const score = scoreFinanceTranscript(texts[i])
    if (score > bestScore) {
      best = texts[i]
      bestScore = score
    }
  }
  return best
}

function scoreFinanceTranscript(raw: string): number {
  const norm = normalizeSpokenNumbers(raw)
  let score = norm.length
  if (/\d/.test(norm)) score += 120
  if (/\d+[.,]?\d*\s*(?:reais|real|r\$)/i.test(norm)) score += 80
  if (/(?:reais|real|r\$)\s*\d+/i.test(norm)) score += 60
  if (/\b(recebi|gastei|paguei|comprei)\b/i.test(norm)) score += 20
  return score
}
