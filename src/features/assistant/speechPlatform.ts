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

export function getDictationListeningHint(): string {
  if (isAndroid()) {
    return 'Fale numa frase só: “10 reais coxinha” (ou “dez reais…”). Toque 🎤 para parar e ↑ para enviar.'
  }
  if (isAppleMobile()) {
    return 'Fale a frase inteira. Toque 🎤 para parar e envie com ↑.'
  }
  return 'Falando… o texto aparece no campo. Toque 🎤 para parar e envie com ↑'
}

/** No Android, alternativas do Google às vezes trazem o número num hipótese diferente. */
export function pickRecognitionTranscript(
  alternatives: ReadonlyArray<{ transcript?: string } | undefined>,
  preferNumeric: boolean,
): string {
  const texts = alternatives
    .map((a) => a?.transcript?.replace(/\s+/g, ' ').trim())
    .filter((t): t is string => Boolean(t))
  if (!texts.length) return ''
  if (!preferNumeric) return texts[0]

  let best = texts[0]
  for (const t of texts) {
    const norm = normalizeSpokenNumbers(t)
    const bestNorm = normalizeSpokenNumbers(best)
    const tNum = /\d/.test(norm)
    const bestNum = /\d/.test(bestNorm)
    if (tNum && !bestNum) {
      best = t
      continue
    }
    if (tNum === bestNum && norm.length > bestNorm.length) best = t
  }
  return best
}
