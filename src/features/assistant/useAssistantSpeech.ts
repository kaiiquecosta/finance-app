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

export type AssistantSpeechMode = 'live' | 'none'

export type AssistantSpeechErrorKind =
  | 'mic-permission'
  | 'speech-permission'
  | 'network'
  | 'unsupported'
  | 'generic'
  | null

const FREE_VOICE_HINT =
  'Áudio por voz é grátis no Chrome, Edge ou Safari (incluindo PWA). Neste navegador, digite no campo.'

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function detectAssistantSpeechMode(): AssistantSpeechMode {
  if (typeof window === 'undefined') return 'none'
  if (!window.isSecureContext) return 'none'
  if (!navigator.mediaDevices?.getUserMedia) return 'none'
  if (getSpeechRecognitionCtor()) return 'live'
  return 'none'
}

function transcriptFromResults(results: SpeechRecognitionResultList): string {
  let out = ''
  for (let i = 0; i < results.length; i++) {
    out += results[i][0]?.transcript ?? ''
  }
  return out.trim()
}

async function requestMicrophone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
    },
  })
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
  const streamRef = useRef<MediaStream | null>(null)

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
    releaseStream()
  }, [releaseStream])

  const startLive = useCallback(
    (Ctor: SpeechRecognitionCtor) => {
      wantListenRef.current = true

      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }

      const rec = new Ctor()
      rec.lang = 'pt-BR'
      rec.continuous = !isAppleMobile()
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onresult = (event) => {
        const line = transcriptFromResults(event.results)
        if (line) onTranscriptRef.current(line)
      }

      rec.onerror = (ev) => {
        if (ev.error === 'aborted' || ev.error === 'no-speech') return
        wantListenRef.current = false
        setListening(false)
        releaseStream()
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
          releaseStream()
          return
        }
        try {
          rec.start()
        } catch {
          wantListenRef.current = false
          setListening(false)
          releaseStream()
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
        releaseStream()
      }
    },
    [releaseStream],
  )

  const start = useCallback(async () => {
    setError(null)
    setErrorKind(null)
    if (!supported) {
      setErrorKind('unsupported')
      setError(FREE_VOICE_HINT)
      return
    }
    if (listening) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setErrorKind('unsupported')
      setError(FREE_VOICE_HINT)
      return
    }

    try {
      releaseStream()
      // Pede permissão ao usuário, mas libera o dispositivo antes do SpeechRecognition
      // (manter getUserMedia aberto costuma impedir o ditado no Chrome).
      const stream = await requestMicrophone()
      stream.getTracks().forEach((t) => t.stop())
      startLive(Ctor)
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorKind('mic-permission')
        setError('Permita o microfone para o Flux (site ou app instalado).')
      } else if (name === 'NotFoundError') {
        setErrorKind('generic')
        setError('Nenhum microfone encontrado neste aparelho.')
      } else {
        setErrorKind('generic')
        setError('Não foi possível acessar o microfone.')
      }
      releaseStream()
    }
  }, [supported, listening, releaseStream, startLive])

  const toggle = useCallback(() => {
    if (listening) stop()
    else void start()
  }, [listening, stop, start])

  useEffect(() => {
    return () => {
      wantListenRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
      releaseStream()
    }
  }, [releaseStream])

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
    freeVoiceHint: FREE_VOICE_HINT,
  }
}
