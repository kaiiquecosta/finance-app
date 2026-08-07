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

type SpeechRecognitionResultList = {
  length: number
  [index: number]: { isFinal: boolean; [index: number]: { transcript: string } | undefined }
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
  if (typeof window !== 'undefined' && !window.isSecureContext) return false
  return getSpeechRecognition() != null
}

function transcriptFromResults(results: SpeechRecognitionResultList): string {
  let out = ''
  for (let i = 0; i < results.length; i++) {
    out += results[i][0]?.transcript ?? ''
  }
  return out.trim()
}

/**
 * Ditado contínuo (Web Speech API). Envia o texto acumulado a cada atualização;
 * quem usa decide se grava ou só preenche o campo (envio manual).
 */
export function useSpeechInput(options: {
  onTranscript: (fullLine: string) => void
  onSessionEnd?: () => void
}) {
  const { onTranscript, onSessionEnd } = options
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const wantListenRef = useRef(false)
  const supported = isSpeechRecognitionSupported()

  const stop = useCallback(() => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
    onSessionEnd?.()
  }, [onSessionEnd])

  const start = useCallback(() => {
    setError(null)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Microfone exige HTTPS (ou localhost). Abra o app em conexão segura.')
      return
    }

    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setError('Áudio indisponível. Use Chrome ou Edge (desktop ou celular).')
      return
    }

    wantListenRef.current = true

    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }

    const attach = () => {
      const rec = new Ctor()
      rec.lang = 'pt-BR'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onresult = (event) => {
        const line = transcriptFromResults(event.results)
        if (line) onTranscriptRef.current(line)
      }

      rec.onerror = (ev) => {
        if (ev.error === 'aborted') return
        if (ev.error === 'no-speech') return
        wantListenRef.current = false
        setListening(false)
        if (ev.error === 'not-allowed') {
          setError('Permita o microfone no navegador (ícone de cadeado na barra de endereço).')
        } else if (ev.error === 'network') {
          setError('Reconhecimento de voz precisa de internet. Verifique a conexão.')
        } else {
          setError('Não foi possível usar o microfone. Tente digitar.')
        }
      }

      rec.onend = () => {
        if (!wantListenRef.current) {
          setListening(false)
          onSessionEnd?.()
          return
        }
        try {
          rec.start()
        } catch {
          wantListenRef.current = false
          setListening(false)
          onSessionEnd?.()
        }
      }

      recRef.current = rec
      rec.start()
      setListening(true)
    }

    try {
      attach()
    } catch {
      setError('Microfone ocupado ou indisponível.')
      wantListenRef.current = false
      setListening(false)
    }
  }, [onSessionEnd])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => {
    return () => {
      wantListenRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { supported, listening, error, start, stop, toggle, clearError: () => setError(null) }
}
