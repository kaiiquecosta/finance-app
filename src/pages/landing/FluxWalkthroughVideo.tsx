import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  enterWalkthroughSounds,
  leaveWalkthroughSounds,
  playWalkthroughClick,
  playWalkthroughImpact,
  playWalkthroughWhoosh,
  startWalkthroughMusic,
  stopWalkthroughMusic,
} from './walkthroughSounds'
import './fluxWalkthroughVideo.css'

type Chapter = {
  at: number
  end: number
  label: string
  impact: string
  caption: string
}

/** Capítulos alinhados à gravação real do app (~36s). */
const CHAPTERS: Chapter[] = [
  {
    at: 0,
    end: 6.5,
    label: 'Visão geral',
    impact: 'Clareza do mês',
    caption: 'Rendas, gastos e o que importa — sem planilha.',
  },
  {
    at: 6.5,
    end: 10.5,
    label: 'Transações',
    impact: 'Histórico limpo',
    caption: 'Cada lançamento no lugar certo.',
  },
  {
    at: 10.5,
    end: 16,
    label: 'Cartões',
    impact: 'Faturas sob controle',
    caption: 'Limites, vencimentos e lançamentos.',
  },
  {
    at: 16,
    end: 20.5,
    label: 'Metas',
    impact: 'Objetivos com prazo',
    caption: 'Progresso visual do que você está construindo.',
  },
  {
    at: 20.5,
    end: 25.5,
    label: 'Investidor',
    impact: 'Do CDI à bolsa',
    caption: 'Cotações e carteira na mesma experiência.',
  },
  {
    at: 25.5,
    end: 32,
    label: 'Assistente',
    impact: 'Fale ou digite',
    caption: 'Registre em português, como no dia a dia.',
  },
  {
    at: 32,
    end: 36,
    label: 'Comunidade',
    impact: 'Peça e vote',
    caption: 'Sugestões que viram produto.',
  },
]

const FALLBACK_DURATION = 36

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function chapterAt(t: number): Chapter {
  return CHAPTERS.find((c) => t >= c.at && t < c.end) ?? CHAPTERS[CHAPTERS.length - 1]
}

export function FluxWalkthroughVideo() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(FALLBACK_DURATION)
  const [showImpact, setShowImpact] = useState(true)
  const [scrubbing, setScrubbing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const lastChapterRef = useRef('')
  const wasPlayingRef = useRef(false)

  const chapter = chapterAt(current)
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0

  const syncAudioSession = useCallback(
    (want: boolean) => {
      if (want && !muted) {
        enterWalkthroughSounds()
        void startWalkthroughMusic()
      } else {
        leaveWalkthroughSounds()
        stopWalkthroughMusic()
      }
    },
    [muted],
  )

  const openModal = () => {
    setOpen(true)
    setShowImpact(true)
    setCurrent(0)
    lastChapterRef.current = ''
    document.body.style.overflow = 'hidden'
  }

  useEffect(() => {
    if (!open) return
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    void v.play().then(() => {
      setPlaying(true)
      syncAudioSession(true)
      void playWalkthroughImpact()
    })
  }, [open, syncAudioSession])

  const closeModal = () => {
    const v = videoRef.current
    v?.pause()
    setPlaying(false)
    setOpen(false)
    document.body.style.overflow = ''
    syncAudioSession(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (chapter.label !== lastChapterRef.current) {
      lastChapterRef.current = chapter.label
      setShowImpact(true)
      if (!muted) {
        void playWalkthroughWhoosh()
        void playWalkthroughImpact()
      }
      const t = window.setTimeout(() => setShowImpact(false), 2400)
      return () => window.clearTimeout(t)
    }
  }, [chapter.label, open, muted])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPlaying(true)
      syncAudioSession(true)
      void playWalkthroughClick()
    } else {
      v.pause()
      setPlaying(false)
      syncAudioSession(false)
    }
  }

  const seekFromClientX = (clientX: number) => {
    const bar = barRef.current
    const v = videoRef.current
    if (!bar || !v || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const next = ratio * duration
    v.currentTime = next
    setCurrent(next)
  }

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const v = videoRef.current
    wasPlayingRef.current = Boolean(v && !v.paused)
    v?.pause()
    setScrubbing(true)
    setPlaying(false)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekFromClientX(e.clientX)
  }

  const onBarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    seekFromClientX(e.clientX)
  }

  const onBarPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    setScrubbing(false)
    seekFromClientX(e.clientX)
    void playWalkthroughClick()
    if (wasPlayingRef.current) {
      void videoRef.current?.play()
      setPlaying(true)
      syncAudioSession(true)
    }
  }

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m
      if (next) {
        leaveWalkthroughSounds()
        stopWalkthroughMusic()
      } else if (open && playing) {
        enterWalkthroughSounds()
        void startWalkthroughMusic()
      }
      return next
    })
  }

  return (
    <>
      <section className="lp-wt-section" id="como-funciona">
        <div className="lp-wt-section-copy">
          <span className="lp-kicker">Tour em vídeo</span>
          <h2>Entenda como funciona o Flux</h2>
          <p>
            Uma gravação real do app em uso — visão geral, cartões, metas, investidor e assistente — com áudio
            suave e controles completos.
          </p>
          <ul>
            <li>Sessão real, sem slides</li>
            <li>Assistente: digitar como no dia a dia</li>
            <li>Trilha discreta · arraste a barra</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Ver como funciona <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Reproduzir tour do Flux">
          <div className="lp-wt-poster-frame">
            <video
              className="lp-wt-poster-img"
              src="/landing/walkthrough/flux-tour.mp4"
              muted
              playsInline
              preload="metadata"
              aria-hidden
            />
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">{formatTime(FALLBACK_DURATION)}</span>
          </div>
          <span className="lp-wt-poster-caption">Gravação real do app · ~0:36</span>
        </button>
      </section>

      {open ? (
        <div className="lp-wt-modal" role="dialog" aria-modal aria-label="Tour do Flux">
          <div className="lp-wt-modal-backdrop" onClick={closeModal} aria-hidden />
          <div className="lp-wt-modal-panel">
            <header className="lp-wt-modal-head">
              <b>Entenda como funciona o Flux</b>
              <div className="lp-wt-head-actions">
                <button type="button" className="lp-wt-mute" onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <button type="button" className="lp-wt-close" onClick={closeModal} aria-label="Fechar">
                  ✕
                </button>
              </div>
            </header>

            <div className="lp-wt-player">
              <div className="lp-wt-cinema lp-wt-cinema--live">
                <video
                  ref={videoRef}
                  className="lp-wt-video"
                  playsInline
                  preload="auto"
                  poster="/landing/walkthrough/overview-app.png"
                  onTimeUpdate={() => {
                    const v = videoRef.current
                    if (v && !scrubbing) setCurrent(v.currentTime)
                  }}
                  onLoadedMetadata={() => {
                    const v = videoRef.current
                    if (v && Number.isFinite(v.duration)) setDuration(v.duration)
                  }}
                  onEnded={() => {
                    setPlaying(false)
                    syncAudioSession(false)
                  }}
                  onPlay={() => setPlaying(true)}
                  onPause={() => {
                    if (!scrubbing) setPlaying(false)
                  }}
                >
                  <source src="/landing/walkthrough/flux-tour.mp4" type="video/mp4" />
                  <source src="/landing/walkthrough/flux-tour.webm" type="video/webm" />
                </video>

                <div className="lp-wt-frame-glow" aria-hidden />

                {showImpact ? (
                  <div className="lp-wt-impact-wrap" key={chapter.label}>
                    <p className="lp-wt-impact">{chapter.impact}</p>
                  </div>
                ) : null}

                <div className="lp-wt-subtitles">
                  <span>{chapter.label}</span>
                  <p>{chapter.caption}</p>
                </div>
              </div>
            </div>

            <footer className="lp-wt-controls">
              <button
                type="button"
                className="lp-wt-ctrl-play"
                aria-label={playing ? 'Pausar' : 'Reproduzir'}
                onClick={togglePlay}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <span className="lp-wt-time">{formatTime(current)}</span>
              <div
                ref={barRef}
                className={`lp-wt-progress${scrubbing ? ' is-scrubbing' : ''}`}
                role="slider"
                tabIndex={0}
                aria-label="Posição do vídeo"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                onPointerDown={onBarPointerDown}
                onPointerMove={onBarPointerMove}
                onPointerUp={onBarPointerUp}
                onPointerCancel={onBarPointerUp}
                onKeyDown={(e) => {
                  const v = videoRef.current
                  if (!v) return
                  if (e.key === 'ArrowRight') {
                    v.currentTime = Math.min(duration, v.currentTime + 2)
                    setCurrent(v.currentTime)
                  }
                  if (e.key === 'ArrowLeft') {
                    v.currentTime = Math.max(0, v.currentTime - 2)
                    setCurrent(v.currentTime)
                  }
                }}
              >
                <i style={{ width: `${progress}%` }} />
                <span className="lp-wt-thumb" style={{ left: `${progress}%` }} aria-hidden />
              </div>
              <span className="lp-wt-time">{formatTime(duration)}</span>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
