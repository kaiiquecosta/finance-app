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
  for (let i = 0; i < results.length; i++) {
    if (results[i].isFinal) continue
    const piece = results[i].transcript.replace(/\s+/g, ' ').trim()
    if (piece) interim = appendSpeechFragment(interim, piece)
  }

  const line = appendSpeechFragment(finals, interim)
  return { sessionFinal: finals, line }
}
