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

type ClickCue = { at: number; x: number; y: number }

type Scene =
  | {
      kind: 'slide'
      id: string
      duration: number
      eyebrow?: string
      title: string
      accent?: string
      subtitle?: string
    }
  | {
      kind: 'footage'
      id: string
      duration: number
      /** Faixa no vídeo fonte (segundos). */
      srcFrom: number
      srcTo: number
      label: string
      caption: string
      clicks?: ClickCue[]
    }

/**
 * Timeline estilo Pora: slides de impacto (texto/degradê) + gravação real do app.
 * Sem texto flutuando por cima da UI.
 */
const SCENES: Scene[] = [
  {
    kind: 'slide',
    id: 'intro',
    duration: 3.4,
    eyebrow: 'Flux',
    title: 'tudo em um só lugar',
    accent: 'um só lugar',
    subtitle: 'Finanças, cartões, metas e investidor — como no dia a dia.',
  },
  {
    kind: 'footage',
    id: 'overview',
    duration: 5.8,
    srcFrom: 0.4,
    srcTo: 6.2,
    label: 'Visão geral',
    caption: 'Rendas, gastos e o mês inteiro com clareza.',
    clicks: [
      { at: 1.2, x: 90, y: 16 },
      { at: 3.2, x: 48, y: 42 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-cards',
    duration: 2.6,
    eyebrow: 'Cartões',
    title: 'faturas sob controle',
    accent: 'sob controle',
    subtitle: 'Limites, vencimentos e lançamentos.',
  },
  {
    kind: 'footage',
    id: 'cards',
    duration: 5.2,
    srcFrom: 10.8,
    srcTo: 16,
    label: 'Cartões',
    caption: 'Nubank, Itaú e o restante — sem planilha.',
    clicks: [
      { at: 1.4, x: 72, y: 30 },
      { at: 3.0, x: 40, y: 58 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-goals',
    duration: 2.6,
    eyebrow: 'Metas',
    title: 'progresso que você vê',
    accent: 'você vê',
    subtitle: 'Objetivos com prazo e depósitos claros.',
  },
  {
    kind: 'footage',
    id: 'goals',
    duration: 4.4,
    srcFrom: 16.2,
    srcTo: 20.5,
    label: 'Metas',
    caption: 'Disney, reserva, entrada do apê — no mesmo lugar.',
    clicks: [{ at: 1.8, x: 82, y: 48 }],
  },
  {
    kind: 'slide',
    id: 'slide-invest',
    duration: 2.6,
    eyebrow: 'Investidor',
    title: 'do CDI à bolsa',
    accent: 'à bolsa',
    subtitle: 'Cotações ao vivo, FIIs, ETFs e cripto.',
  },
  {
    kind: 'footage',
    id: 'invest',
    duration: 4.8,
    srcFrom: 20.7,
    srcTo: 25.4,
    label: 'Investimentos',
    caption: 'Carteira e mercado sem trocar de app.',
    clicks: [
      { at: 1.2, x: 28, y: 20 },
      { at: 2.8, x: 55, y: 45 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-assistant',
    duration: 2.6,
    eyebrow: 'Assistente',
    title: 'fale ou digite',
    accent: 'ou digite',
    subtitle: 'Registre gastos em português natural.',
  },
  {
    kind: 'footage',
    id: 'assistant',
    duration: 6.0,
    srcFrom: 25.8,
    srcTo: 31.8,
    label: 'Assistente',
    caption: '“Gastei 45 no mercado” — e o Flux anota.',
    clicks: [
      { at: 0.8, x: 92, y: 88 },
      { at: 3.2, x: 55, y: 82 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-community',
    duration: 2.6,
    eyebrow: 'Comunidade',
    title: 'peça. vote. acompanhe.',
    accent: 'vote.',
    subtitle: 'Roadmap aberto com quem usa o Flux.',
  },
  {
    kind: 'footage',
    id: 'community',
    duration: 3.6,
    srcFrom: 32.2,
    srcTo: 35.8,
    label: 'Comunidade',
    caption: 'Sugestões que viram produto.',
    clicks: [{ at: 1.4, x: 70, y: 24 }],
  },
  {
    kind: 'slide',
    id: 'outro',
    duration: 3.8,
    eyebrow: 'Flux Pro',
    title: 'e tem muito mais',
    accent: 'muito mais',
    subtitle: 'Parcelas · assinaturas · contas · OFX · e o que vier a seguir.',
  },
]

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0)

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function resolveScene(t: number) {
  const looped = ((t % TOTAL) + TOTAL) % TOTAL
  let acc = 0
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]
    if (looped < acc + scene.duration) {
      return { index: i, local: looped - acc, scene, looped }
    }
    acc += scene.duration
  }
  const last = SCENES.length - 1
  return { index: last, local: 0, scene: SCENES[last], looped: TOTAL }
}

function renderSlideTitle(title: string, accent?: string) {
  if (!accent || !title.includes(accent)) {
    return <span className="lp-wt-slide-title-grad">{title}</span>
  }
  const i = title.indexOf(accent)
  return (
    <>
      {title.slice(0, i)}
      <span className="lp-wt-slide-title-grad">{accent}</span>
      {title.slice(i + accent.length)}
    </>
  )
}

export function FluxWalkthroughVideo() {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number; pulse: boolean } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)
  const sceneIdRef = useRef('')
  const firedClicksRef = useRef('')
  const wasPlayingRef = useRef(false)

  const { local, scene, looped } = resolveScene(elapsed)
  const progress = (looped / TOTAL) * 100

  const syncAudio = useCallback(
    (on: boolean) => {
      if (on && !muted) {
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
    setElapsed(0)
    elapsedRef.current = 0
    sceneIdRef.current = ''
    firedClicksRef.current = ''
    setCursor(null)
    setPlaying(true)
    document.body.style.overflow = 'hidden'
    syncAudio(true)
    void playWalkthroughImpact()
  }

  const closeModal = () => {
    cancelAnimationFrame(rafRef.current)
    videoRef.current?.pause()
    setPlaying(false)
    setOpen(false)
    setCursor(null)
    document.body.style.overflow = ''
    syncAudio(false)
  }

  // Clock da timeline virtual
  useEffect(() => {
    if (!open || !playing || scrubbing) return
    let cancelled = false
    const start = performance.now() - elapsedRef.current * 1000
    const tick = () => {
      if (cancelled) return
      const t = (performance.now() - start) / 1000
      elapsedRef.current = t
      setElapsed(t)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [open, playing, scrubbing])

  // Troca de cena: slide vs footage + seek no vídeo
  useEffect(() => {
    if (!open) return
    if (scene.id !== sceneIdRef.current) {
      sceneIdRef.current = scene.id
      firedClicksRef.current = ''
      setCursor(null)
      if (!muted) void playWalkthroughWhoosh()

      const v = videoRef.current
      if (scene.kind === 'footage' && v) {
        v.currentTime = scene.srcFrom + Math.min(local, scene.srcTo - scene.srcFrom - 0.05)
        if (playing) void v.play().catch(() => undefined)
      } else {
        v?.pause()
      }
    }
  }, [scene, open, muted, playing, local])

  // Mantém vídeo sincronizado dentro da faixa
  useEffect(() => {
    if (!open || scene.kind !== 'footage' || scrubbing) return
    const v = videoRef.current
    if (!v) return
    const target = scene.srcFrom + local
    if (Math.abs(v.currentTime - target) > 0.35) {
      v.currentTime = Math.min(target, scene.srcTo - 0.05)
    }
    if (playing && v.paused) void v.play().catch(() => undefined)
    if (!playing && !v.paused) v.pause()
  }, [local, scene, open, playing, scrubbing])

  // Clicks animados
  useEffect(() => {
    if (!open || scene.kind !== 'footage' || !playing || muted === undefined) return
    for (let i = 0; i < (scene.clicks?.length ?? 0); i++) {
      const cue = scene.clicks![i]
      const key = `${scene.id}-${i}`
      if (local >= cue.at && !firedClicksRef.current.includes(`${key},`)) {
        firedClicksRef.current += `${key},`
        setCursor({ x: cue.x, y: cue.y, pulse: true })
        if (!muted) void playWalkthroughClick()
        window.setTimeout(() => {
          setCursor((c) => (c ? { ...c, pulse: false } : null))
        }, 450)
      }
    }
  }, [local, scene, open, playing, muted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => {
          const next = !p
          syncAudio(next)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, syncAudio])

  const seekTimeline = (nextSec: number) => {
    const clamped = Math.min(TOTAL - 0.05, Math.max(0, nextSec))
    elapsedRef.current = clamped
    setElapsed(clamped)
    const resolved = resolveScene(clamped)
    sceneIdRef.current = ''
    firedClicksRef.current = ''
    setCursor(null)
    const v = videoRef.current
    if (resolved.scene.kind === 'footage' && v) {
      v.currentTime = resolved.scene.srcFrom + resolved.local
    }
  }

  const onBarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    wasPlayingRef.current = playing
    setPlaying(false)
    setScrubbing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    seekTimeline(((e.clientX - rect.left) / rect.width) * TOTAL)
  }

  const onBarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    const rect = e.currentTarget.getBoundingClientRect()
    seekTimeline(((e.clientX - rect.left) / rect.width) * TOTAL)
  }

  const onBarPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    setScrubbing(false)
    const rect = e.currentTarget.getBoundingClientRect()
    seekTimeline(((e.clientX - rect.left) / rect.width) * TOTAL)
    void playWalkthroughClick()
    if (wasPlayingRef.current) {
      setPlaying(true)
      syncAudio(true)
    }
  }

  return (
    <>
      <section className="lp-wt-section" id="como-funciona">
        <div className="lp-wt-section-copy">
          <span className="lp-kicker">Tour em vídeo</span>
          <h2>Entenda como funciona o Flux</h2>
          <p>
            Slides de impacto e gravação real do app — cartões, metas, investidor, assistente e comunidade — no
            ritmo de um walkthrough profissional.
          </p>
          <ul>
            <li>Gravação real + cards de título</li>
            <li>Cliques animados na interface</li>
            <li>Trilha de intro · arraste a barra</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Ver como funciona <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Reproduzir tour do Flux">
          <div className="lp-wt-poster-frame">
            <div className="lp-wt-poster-slide-preview" aria-hidden>
              <span>Flux</span>
              <b>
                tudo em <em>um só lugar</em>
              </b>
            </div>
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">{formatTime(TOTAL)}</span>
          </div>
          <span className="lp-wt-poster-caption">Walkthrough · slides + app real</span>
        </button>
      </section>

      {open ? (
        <div className="lp-wt-modal" role="dialog" aria-modal aria-label="Tour do Flux">
          <div className="lp-wt-modal-backdrop" onClick={closeModal} aria-hidden />
          <div className="lp-wt-modal-panel">
            <header className="lp-wt-modal-head">
              <b>Entenda como funciona o Flux</b>
              <div className="lp-wt-head-actions">
                <button
                  type="button"
                  className="lp-wt-mute"
                  onClick={() => {
                    setMuted((m) => {
                      const next = !m
                      if (next) syncAudio(false)
                      else if (playing) syncAudio(true)
                      return next
                    })
                  }}
                  aria-label={muted ? 'Ativar som' : 'Silenciar'}
                >
                  {muted ? '🔇' : '🔊'}
                </button>
                <button type="button" className="lp-wt-close" onClick={closeModal} aria-label="Fechar">
                  ✕
                </button>
              </div>
            </header>

            <div className="lp-wt-player">
              <div className="lp-wt-cinema">
                {/* Vídeo sempre montado (seek), oculto em slides */}
                <video
                  ref={videoRef}
                  className={`lp-wt-video${scene.kind === 'footage' ? ' is-visible' : ''}`}
                  playsInline
                  muted
                  preload="auto"
                  poster="/landing/walkthrough/overview-app.png"
                >
                  <source src="/landing/walkthrough/flux-tour.mp4" type="video/mp4" />
                  <source src="/landing/walkthrough/flux-tour.webm" type="video/webm" />
                </video>

                {scene.kind === 'slide' ? (
                  <div className="lp-wt-title-slide" key={scene.id}>
                    <div className="lp-wt-title-slide-glow" aria-hidden />
                    {scene.eyebrow ? <span className="lp-wt-slide-eyebrow">{scene.eyebrow}</span> : null}
                    <h3 className="lp-wt-slide-title">{renderSlideTitle(scene.title, scene.accent)}</h3>
                    {scene.subtitle ? <p className="lp-wt-slide-sub">{scene.subtitle}</p> : null}
                  </div>
                ) : (
                  <>
                    <div className="lp-wt-frame-glow" aria-hidden />
                    {cursor ? (
                      <span
                        className={`lp-wt-cursor${cursor.pulse ? ' is-pulse' : ''}`}
                        style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                        aria-hidden
                      />
                    ) : null}
                    <div className="lp-wt-subtitles">
                      <span>{scene.label}</span>
                      <p>{scene.caption}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <footer className="lp-wt-controls">
              <button
                type="button"
                className="lp-wt-ctrl-play"
                aria-label={playing ? 'Pausar' : 'Reproduzir'}
                onClick={() => {
                  setPlaying((p) => {
                    const next = !p
                    syncAudio(next)
                    return next
                  })
                }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <span className="lp-wt-time">{formatTime(looped)}</span>
              <div
                ref={barRef}
                className={`lp-wt-progress${scrubbing ? ' is-scrubbing' : ''}`}
                role="slider"
                tabIndex={0}
                aria-label="Posição do tour"
                aria-valuemin={0}
                aria-valuemax={Math.round(TOTAL)}
                aria-valuenow={Math.round(looped)}
                onPointerDown={onBarPointerDown}
                onPointerMove={onBarPointerMove}
                onPointerUp={onBarPointerUp}
                onPointerCancel={onBarPointerUp}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') seekTimeline(elapsedRef.current + 2)
                  if (e.key === 'ArrowLeft') seekTimeline(elapsedRef.current - 2)
                }}
              >
                <i style={{ width: `${progress}%` }} />
                <span className="lp-wt-thumb" style={{ left: `${progress}%` }} aria-hidden />
              </div>
              <span className="lp-wt-time">{formatTime(TOTAL)}</span>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
