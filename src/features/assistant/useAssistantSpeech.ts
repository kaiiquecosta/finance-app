import { useCallback, useEffect, useRef, useState } from 'react'
import { lineFromSpeechResults, polishDictationLine } from './speechTranscript'
import {
  getDictationListeningHint,
  pickRecognitionTranscript,
  speechRecognitionMaxAlternatives,
  useSingleUtteranceDictation,
} from './speechPlatform'

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

export type AssistantSpeechMode = 'live' | 'none'

export type AssistantSpeechErrorKind =
  | 'mic-permission'
  | 'speech-permission'
  | 'network'
  | 'unsupported'
  | 'generic'
  | null

const UNSUPPORTED_VOICE_HINT =
  'Neste navegador o microfone por voz não está disponível. Digite no campo abaixo.'

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function detectAssistantSpeechMode(): AssistantSpeechMode {
  if (typeof window === 'undefined') return 'none'
  if (!window.isSecureContext) return 'none'
  if (!navigator.mediaDevices?.getUserMedia) return 'none'
  if (getSpeechRecognitionCtor()) return 'live'
  return 'none'
}

/**
 * Ditado gratuito via Web Speech API do navegador (sem API paga).
 */
export function useAssistantSpeech(options: {
  onTranscript: (fullLine: string) => void
}) {
  const { onTranscript } = options
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const mode = detectAssistantSpeechMode()
  const supported = mode === 'live'

  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<AssistantSpeechErrorKind>(null)

  const wantListenRef = useRef(false)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const sessionFinalRef = useRef('')
  const bestLineRef = useRef('')
  const heardSpeechRef = useRef(false)

  const stop = useCallback(() => {
    wantListenRef.current = false
    sessionFinalRef.current = ''
    bestLineRef.current = ''
    heardSpeechRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
  }, [])

  const startLive = useCallback(
    (Ctor: SpeechRecognitionCtor) => {
      wantListenRef.current = true
      sessionFinalRef.current = ''
      bestLineRef.current = ''
      heardSpeechRef.current = false

      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }

      const rec = new Ctor()
      rec.lang = 'pt-BR'
      rec.continuous = !useSingleUtteranceDictation()
      rec.interimResults = true
      rec.maxAlternatives = speechRecognitionMaxAlternatives()

      rec.onresult = (event) => {
        heardSpeechRef.current = true
        const slices = Array.from({ length: event.results.length }, (_, i) => {
          const r = event.results[i]
          const altCount = Math.max(1, (r as { length?: number }).length ?? 1)
          const alts = Array.from({ length: altCount }, (_, j) => r[j])
          return {
            isFinal: r.isFinal,
            transcript: pickRecognitionTranscript(alts),
          }
        })
        const { sessionFinal, line } = lineFromSpeechResults(
          slices,
          event.resultIndex,
          sessionFinalRef.current,
        )
        sessionFinalRef.current = sessionFinal
        const polished = polishDictationLine(bestLineRef.current, line)
        bestLineRef.current = polished
        const out = polished || line.replace(/\s+/g, ' ').trim()
        if (out) onTranscriptRef.current(out)
      }

      rec.onerror = (ev) => {
        if (ev.error === 'aborted') return
        if (ev.error === 'no-speech') {
          if (useSingleUtteranceDictation()) wantListenRef.current = false
          return
        }
        wantListenRef.current = false
        setListening(false)
        if (ev.error === 'not-allowed') {
          setErrorKind('speech-permission')
          setError(
            'O ditado por voz não foi autorizado. Confira o microfone no cadeado do site e tente de novo, ou digite no campo.',
          )
        } else if (ev.error === 'network') {
          setErrorKind('network')
          setError('Ditado precisa de internet. Verifique a conexão ou digite no campo.')
        } else {
          setErrorKind('generic')
          setError('Não foi possível ouvir. Tente de novo ou digite no campo.')
        }
      }

      rec.onend = () => {
        if (!wantListenRef.current) {
          setListening(false)
          return
        }
        // Celular: não reiniciar — evita cortar número e duplicar texto.
        if (useSingleUtteranceDictation()) {
          wantListenRef.current = false
          setListening(false)
          if (!heardSpeechRef.current && !bestLineRef.current.trim()) {
            setErrorKind('generic')
            setError(
              'Não ouvi nada. Fale mais perto do microfone ou digite no campo.',
            )
          }
          return
        }
        try {
          rec.start()
        } catch {
          wantListenRef.current = false
          setListening(false)
        }
      }

      recRef.current = rec
      try {
        rec.start()
        setListening(true)
      } catch {
        wantListenRef.current = false
        setErrorKind('generic')
        setError('Não foi possível iniciar o ditado. Tente de novo.')
      }
    },
    [],
  )

  const start = useCallback(() => {
    setError(null)
    setErrorKind(null)
    if (!supported) {
      setErrorKind('unsupported')
      setError(UNSUPPORTED_VOICE_HINT)
      return
    }
    if (listening) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setErrorKind('unsupported')
      setError(UNSUPPORTED_VOICE_HINT)
      return
    }

    // SpeechRecognition.start() precisa rodar no mesmo gesto do clique (sem await antes).
    startLive(Ctor)
  }, [supported, listening, startLive])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, stop, start])

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

  return {
    supported,
    mode,
    activeMode: listening ? ('live' as const) : ('none' as const),
    listening,
    transcribing: false,
    error,
    errorKind,
    start,
    stop,
    toggle,
    clearError: () => {
      setError(null)
      setErrorKind(null)
    },
    unsupportedVoiceHint: UNSUPPORTED_VOICE_HINT,
    listeningHint: getDictationListeningHint(),
  }
}
