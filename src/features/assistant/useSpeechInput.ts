import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionResultEvent = {
  results: SpeechRecognitionResultList
  resultIndex: number
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() != null
}

/** Ditado por voz (Web Speech API, pt-BR). */
export function useSpeechInput(options: {
  onFinal: (transcript: string) => void
  onInterim?: (transcript: string) => void
}) {
  const { onFinal, onInterim } = options
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const supported = isSpeechRecognitionSupported()

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    setError(null)
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setError('Áudio não disponível neste navegador. Use Chrome ou Edge no celular/PC.')
      return
    }

    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }

    const rec = new Ctor()
    rec.lang = 'pt-BR'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript ?? ''
        if (event.results[i].isFinal) final += piece
        else interim += piece
      }
      const draft = (final || interim).trim()
      if (interim.trim() && onInterim) onInterim(draft)
      if (final.trim()) onFinal(final.trim())
    }

    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') {
        setListening(false)
        if (ev.error === 'no-speech') setError('Não ouvi nada. Tente de novo.')
        return
      }
      if (ev.error === 'not-allowed') {
        setError('Permita o microfone nas configurações do navegador.')
      } else {
        setError('Não foi possível usar o microfone. Tente digitar.')
      }
      setListening(false)
    }

    rec.onend = () => setListening(false)

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Microfone ocupado ou indisponível.')
      setListening(false)
    }
  }, [onFinal, onInterim])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { supported, listening, error, toggle, stop, clearError: () => setError(null) }
}
