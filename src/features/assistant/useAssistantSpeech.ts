import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudioBlob, SpeechTranscribeError } from '@/data/speechTranscribe'

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

export type AssistantSpeechMode = 'live' | 'record' | 'none'

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
  if (typeof MediaRecorder !== 'undefined') return 'record'
  return 'none'
}

function transcriptFromResults(results: SpeechRecognitionResultList): string {
  let out = ''
  for (let i = 0; i < results.length; i++) {
    out += results[i][0]?.transcript ?? ''
  }
  return out.trim()
}

function pickRecorderMime(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return undefined
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
 * Ditado para o assistente: ao vivo (Web Speech) ou gravação + Whisper (fallback).
 * O texto vai para `onTranscript`; envio continua manual.
 */
export function useAssistantSpeech(options: {
  onTranscript: (fullLine: string) => void
}) {
  const { onTranscript } = options
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const mode = detectAssistantSpeechMode()
  const supported = mode !== 'none'

  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<AssistantSpeechMode>('none')

  const wantListenRef = useRef(false)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startRecordRef = useRef<(stream: MediaStream) => void>(() => {})

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stopLive = useCallback(() => {
    wantListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
  }, [])

  const stopRecord = useCallback(() => {
    wantListenRef.current = false
    const rec = mediaRecorderRef.current
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    } else {
      releaseStream()
      setListening(false)
      setActiveMode('none')
    }
  }, [releaseStream])

  const stop = useCallback(() => {
    if (activeMode === 'live') stopLive()
    else stopRecord()
  }, [activeMode, stopLive, stopRecord])

  const startLive = useCallback((Ctor: SpeechRecognitionCtor) => {
    wantListenRef.current = true
    setActiveMode('live')
    let switchedToRecording = false

    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }

    const attach = () => {
      const rec = new Ctor()
      rec.lang = 'pt-BR'
      rec.continuous = !isAppleMobile()
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onresult = (event) => {
        const line = transcriptFromResults(event.results)
        if (line) onTranscriptRef.current(line)
      }

      const fallbackToRecording = (reason: string) => {
        if (switchedToRecording) return
        const stream = streamRef.current
        if (stream && typeof MediaRecorder !== 'undefined') {
          switchedToRecording = true
          recRef.current = null
          setError(null)
          // A permissão do microfone já foi validada por getUserMedia.
          // Se o serviço Web Speech do navegador bloquear, gravamos o mesmo
          // stream e transcrevemos no servidor sem culpar a permissão.
          startRecordRef.current(stream)
          return
        }
        wantListenRef.current = false
        setListening(false)
        setActiveMode('none')
        setError(reason)
        releaseStream()
      }

      rec.onerror = (ev) => {
        if (ev.error === 'aborted' || ev.error === 'no-speech') return
        if (ev.error === 'not-allowed') {
          fallbackToRecording('O navegador bloqueou o reconhecimento de voz.')
        } else if (ev.error === 'network') {
          fallbackToRecording('Ditado ao vivo indisponível. Tente de novo ou digite.')
        } else {
          fallbackToRecording('Não foi possível ouvir. Tente de novo ou digite.')
        }
      }

      rec.onend = () => {
        if (switchedToRecording) return
        if (!wantListenRef.current) {
          setListening(false)
          setActiveMode('none')
          releaseStream()
          return
        }
        try {
          rec.start()
        } catch {
          fallbackToRecording('O reconhecimento ao vivo foi interrompido.')
        }
      }

      recRef.current = rec
      rec.start()
      setListening(true)
    }

    attach()
  }, [releaseStream])

  const startRecord = useCallback(
    (stream: MediaStream) => {
      wantListenRef.current = true
      setActiveMode('record')
      chunksRef.current = []

      const mime = pickRecorderMime()
      let recorder: MediaRecorder
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      } catch {
        setError('Gravação de áudio não suportada neste dispositivo.')
        wantListenRef.current = false
        releaseStream()
        return
      }

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }

      recorder.onstop = () => {
        setListening(false)
        setActiveMode('none')
        releaseStream()

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mime || 'audio/webm',
        })
        chunksRef.current = []
        mediaRecorderRef.current = null

        if (blob.size < 100) {
          setError('Gravação muito curta. Segure 🎤 e fale de novo.')
          return
        }

        setTranscribing(true)
        void transcribeAudioBlob(blob)
          .then((text) => {
            onTranscriptRef.current(text)
          })
          .catch((e) => {
            if (e instanceof SpeechTranscribeError && e.code === 'transcription_unconfigured') {
              setError(
                'Neste navegador o áudio usa transcrição no servidor. Peça ao admin para configurar OPENAI_API_KEY no Supabase e publicar speech-transcribe.',
              )
            } else {
              setError(e instanceof Error ? e.message : 'Falha ao transcrever.')
            }
          })
          .finally(() => setTranscribing(false))
      }

      recorder.onerror = () => {
        setError('Erro ao gravar áudio.')
        wantListenRef.current = false
        setListening(false)
        setActiveMode('none')
        releaseStream()
      }

      mediaRecorderRef.current = recorder
      recorder.start(250)
      setListening(true)
    },
    [releaseStream],
  )
  startRecordRef.current = startRecord

  const start = useCallback(async () => {
    setError(null)
    if (!supported) {
      setError('Microfone indisponível. Use HTTPS e um navegador atualizado.')
      return
    }
    if (transcribing) return

    try {
      releaseStream()
      const stream = await requestMicrophone()
      streamRef.current = stream

      const Ctor = getSpeechRecognitionCtor()
      if (mode === 'live' && Ctor) {
        startLive(Ctor)
        return
      }
      startRecord(stream)
    } catch (e) {
      const name = e instanceof DOMException ? e.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Permita o microfone para o Flux (site ou app instalado).')
      } else if (name === 'NotFoundError') {
        setError('Nenhum microfone encontrado neste aparelho.')
      } else {
        setError('Não foi possível acessar o microfone.')
      }
      releaseStream()
    }
  }, [supported, transcribing, releaseStream, mode, startLive, startRecord])

  const toggle = useCallback(() => {
    if (listening) {
      if (activeMode === 'live') stopLive()
      else stopRecord()
    } else {
      void start()
    }
  }, [listening, activeMode, stopLive, stopRecord, start])

  useEffect(() => {
    return () => {
      wantListenRef.current = false
      stopLive()
      try {
        mediaRecorderRef.current?.stop()
      } catch {
        /* ignore */
      }
      releaseStream()
    }
  }, [releaseStream, stopLive])

  return {
    supported,
    mode,
    activeMode,
    listening,
    transcribing,
    error,
    start,
    stop,
    toggle,
    clearError: () => setError(null),
  }
}
