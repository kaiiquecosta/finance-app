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

type TapCue = { at: number; x: number; y: number }

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
      kind: 'lifestyle'
      id: string
      duration: number
      image: string
      eyebrow?: string
      line?: string
      motion?: 'ken-in' | 'ken-out' | 'ken-left'
    }
  | {
      kind: 'phone'
      id: string
      duration: number
      screen: string
      label: string
      caption: string
      motion?: 'zoom-in' | 'zoom-out' | 'rise' | 'drift'
      taps?: TapCue[]
    }

/**
 * Tour cinematográfico estilo Apple:
 * lifestyle (pessoa + celular) → título → close do iPhone com UI real + zooms.
 */
const SCENES: Scene[] = [
  {
    kind: 'lifestyle',
    id: 'open-life',
    duration: 3.6,
    image: '/landing/walkthrough/lifestyle/cafe.jpg',
    eyebrow: 'Flux',
    line: 'No bolso. No café. No dia a dia.',
    motion: 'ken-in',
  },
  {
    kind: 'slide',
    id: 'intro',
    duration: 3.0,
    eyebrow: 'Flux',
    title: 'tudo em um só lugar',
    accent: 'um só lugar',
    subtitle: 'Finanças claras — com o ritmo de um product film.',
  },
  {
    kind: 'phone',
    id: 'overview',
    duration: 5.2,
    screen: '/landing/walkthrough/mobile/overview.jpg',
    label: 'Visão geral',
    caption: 'Rendas, gastos e o mês inteiro — num olhar.',
    motion: 'rise',
    taps: [
      { at: 1.2, x: 78, y: 18 },
      { at: 3.0, x: 50, y: 42 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-cards',
    duration: 2.2,
    eyebrow: 'Cartões',
    title: 'faturas sob controle',
    accent: 'sob controle',
  },
  {
    kind: 'phone',
    id: 'cards',
    duration: 4.6,
    screen: '/landing/walkthrough/mobile/cards.jpg',
    label: 'Cartões',
    caption: 'Limites, vencimentos e lançamentos.',
    motion: 'zoom-in',
    taps: [
      { at: 1.1, x: 72, y: 48 },
      { at: 2.8, x: 50, y: 62 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-goals',
    duration: 2.2,
    eyebrow: 'Metas',
    title: 'progresso que você vê',
    accent: 'você vê',
  },
  {
    kind: 'phone',
    id: 'goals',
    duration: 4.4,
    screen: '/landing/walkthrough/mobile/goals.jpg',
    label: 'Metas',
    caption: 'Disney, reserva, entrada do apê.',
    motion: 'drift',
    taps: [{ at: 1.6, x: 50, y: 55 }],
  },
  {
    kind: 'slide',
    id: 'slide-invest',
    duration: 2.2,
    eyebrow: 'Investidor',
    title: 'do CDI à bolsa',
    accent: 'à bolsa',
  },
  {
    kind: 'phone',
    id: 'invest',
    duration: 4.4,
    screen: '/landing/walkthrough/mobile/invest.jpg',
    label: 'Investimentos',
    caption: 'Mercado ao vivo, sem trocar de app.',
    motion: 'zoom-in',
    taps: [
      { at: 1.0, x: 40, y: 30 },
      { at: 2.6, x: 55, y: 52 },
    ],
  },
  {
    kind: 'lifestyle',
    id: 'mid-life',
    duration: 3.2,
    image: '/landing/walkthrough/lifestyle/sofa.jpg',
    eyebrow: 'Assistente',
    line: 'Fale. Digite. O Flux anota.',
    motion: 'ken-left',
  },
  {
    kind: 'phone',
    id: 'assistant',
    duration: 5.0,
    screen: '/landing/walkthrough/mobile/assistant.jpg',
    label: 'Assistente',
    caption: '“Gastei 45 no mercado” — e pronto.',
    motion: 'rise',
    taps: [
      { at: 0.8, x: 50, y: 78 },
      { at: 2.6, x: 82, y: 86 },
    ],
  },
  {
    kind: 'slide',
    id: 'slide-community',
    duration: 2.4,
    eyebrow: 'Comunidade',
    title: 'peça. vote. acompanhe.',
    accent: 'vote.',
  },
  {
    kind: 'phone',
    id: 'community',
    duration: 5.0,
    screen: '/landing/walkthrough/mobile/community.jpg',
    label: 'Comunidade',
    caption: 'Roadmap aberto — curta o que importa.',
    motion: 'zoom-in',
    taps: [
      { at: 1.2, x: 78, y: 22 },
      { at: 2.8, x: 72, y: 48 },
    ],
  },
  {
    kind: 'phone',
    id: 'community-modal',
    duration: 5.2,
    screen: '/landing/walkthrough/mobile/community-modal.jpg',
    label: 'Nova sugestão',
    caption: 'Descreva. Publique. Acompanhe o que vira produto.',
    motion: 'zoom-out',
    taps: [
      { at: 1.4, x: 50, y: 38 },
      { at: 3.2, x: 70, y: 72 },
    ],
  },
  {
    kind: 'lifestyle',
    id: 'close-life',
    duration: 3.4,
    image: '/landing/walkthrough/lifestyle/cafe.jpg',
    eyebrow: 'Flux Pro',
    line: 'E tem muito mais.',
    motion: 'ken-out',
  },
  {
    kind: 'slide',
    id: 'outro',
    duration: 3.4,
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
  const [tap, setTap] = useState<{ x: number; y: number; pulse: boolean } | null>(null)

  const barRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)
  const sceneIdRef = useRef('')
  const firedTapsRef = useRef('')
  const wasPlayingRef = useRef(false)

  const { local, scene, looped } = resolveScene(elapsed)
  const progress = (looped / TOTAL) * 100
  const sceneProgress = scene.duration > 0 ? Math.min(1, local / scene.duration) : 0

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
    firedTapsRef.current = ''
    setTap(null)
    setPlaying(true)
    document.body.style.overflow = 'hidden'
    syncAudio(true)
    void playWalkthroughImpact()
  }

  const closeModal = () => {
    cancelAnimationFrame(rafRef.current)
    setPlaying(false)
    setOpen(false)
    setTap(null)
    document.body.style.overflow = ''
    syncAudio(false)
  }

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

  useEffect(() => {
    if (!open) return
    if (scene.id !== sceneIdRef.current) {
      sceneIdRef.current = scene.id
      firedTapsRef.current = ''
      setTap(null)
      if (!muted) void playWalkthroughWhoosh()
    }
  }, [scene, open, muted])

  // Toques no celular (anel estilo Apple)
  useEffect(() => {
    if (!open || scene.kind !== 'phone') {
      setTap(null)
      return
    }
    const cues = scene.taps ?? []
    if (!cues.length) return

    let x = cues[0].x
    let y = cues[0].y
    if (local < cues[0].at) {
      const t = Math.max(0, Math.min(1, local / Math.max(0.01, cues[0].at)))
      const ease = 1 - (1 - t) ** 3
      x = 50 + (cues[0].x - 50) * ease
      y = 40 + (cues[0].y - 40) * ease
    } else {
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i]
        const next = cues[i + 1]
        if (!next || local < next.at) {
          if (!next) {
            x = cue.x
            y = cue.y
          } else {
            const span = Math.max(0.01, next.at - cue.at)
            const t = Math.max(0, Math.min(1, (local - cue.at) / span))
            const ease = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
            x = cue.x + (next.x - cue.x) * ease
            y = cue.y + (next.y - cue.y) * ease
          }
          break
        }
      }
    }

    let pulse = false
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i]
      const key = `${scene.id}-${i}`
      if (local >= cue.at && !firedTapsRef.current.includes(`${key},`)) {
        firedTapsRef.current += `${key},`
        pulse = true
        if (!muted) void playWalkthroughClick()
        window.setTimeout(() => setTap((c) => (c ? { ...c, pulse: false } : null)), 480)
      }
    }

    setTap((prev) => ({ x, y, pulse: pulse || Boolean(prev?.pulse) }))
  }, [local, scene, open, muted])

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
    sceneIdRef.current = ''
    firedTapsRef.current = ''
    setTap(null)
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
            Um product film no celular: pessoa usando o Flux, closes da interface, zooms e a comunidade
            funcionando — no ritmo Apple.
          </p>
          <ul>
            <li>Lifestyle + iPhone em close</li>
            <li>Focos e aproximações na UI real</li>
            <li>Trilha suave · arraste a barra</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Ver como funciona <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Reproduzir tour do Flux">
          <div className="lp-wt-poster-frame">
            <img
              className="lp-wt-poster-life"
              src="/landing/walkthrough/lifestyle/cafe.jpg"
              alt=""
              loading="lazy"
            />
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">{formatTime(TOTAL)}</span>
          </div>
          <span className="lp-wt-poster-caption">Product film · celular + app real</span>
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
              <div className="lp-wt-cinema" style={{ ['--scene-p' as string]: String(sceneProgress) }}>
                {scene.kind === 'slide' ? (
                  <div className="lp-wt-title-slide" key={scene.id}>
                    <div className="lp-wt-title-slide-glow" aria-hidden />
                    {scene.eyebrow ? <span className="lp-wt-slide-eyebrow">{scene.eyebrow}</span> : null}
                    <h3 className="lp-wt-slide-title">{renderSlideTitle(scene.title, scene.accent)}</h3>
                    {scene.subtitle ? <p className="lp-wt-slide-sub">{scene.subtitle}</p> : null}
                  </div>
                ) : null}

                {scene.kind === 'lifestyle' ? (
                  <div className={`lp-wt-life lp-wt-life--${scene.motion ?? 'ken-in'}`} key={scene.id}>
                    <img src={scene.image} alt="" draggable={false} />
                    <div className="lp-wt-life-veil" aria-hidden />
                    <div className="lp-wt-life-copy">
                      {scene.eyebrow ? <span>{scene.eyebrow}</span> : null}
                      {scene.line ? <p>{scene.line}</p> : null}
                    </div>
                  </div>
                ) : null}

                {scene.kind === 'phone' ? (
                  <div className={`lp-wt-phone-stage lp-wt-phone-stage--${scene.motion ?? 'rise'}`} key={scene.id}>
                    <div className="lp-wt-phone-glow" aria-hidden />
                    <div className="lp-wt-phone">
                      <div className="lp-wt-phone-bezel">
                        <span className="lp-wt-phone-island" aria-hidden />
                        <div className="lp-wt-phone-screen">
                          <img src={scene.screen} alt="" draggable={false} />
                          {tap ? (
                            <span
                              className={`lp-wt-finger${tap.pulse ? ' is-pulse' : ''}`}
                              style={{ left: `${tap.x}%`, top: `${tap.y}%` }}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="lp-wt-subtitles">
                      <span>{scene.label}</span>
                      <p>{scene.caption}</p>
                    </div>
                  </div>
                ) : null}
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
