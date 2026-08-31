import { useCallback, useEffect, useRef, useState } from 'react'
import {
  enterWalkthroughSounds,
  leaveWalkthroughSounds,
  playWalkthroughClick,
  playWalkthroughImpact,
  playWalkthroughKey,
  playWalkthroughSend,
  playWalkthroughWhoosh,
  startWalkthroughMusic,
  stopWalkthroughMusic,
} from './walkthroughSounds'
import './fluxWalkthroughVideo.css'

type SceneCue = {
  atMs: number
  kind: 'click' | 'impact' | 'type' | 'send'
  x?: number
  y?: number
}

type Scene = {
  id: string
  image: string
  label: string
  impact: string
  caption: string
  durationMs: number
  kenBurns: 'in' | 'out' | 'pan-left' | 'pan-right'
  cues: SceneCue[]
}

const SCENES: Scene[] = [
  {
    id: 'overview',
    image: '/landing/walkthrough/overview.png',
    label: 'Visão geral',
    impact: 'Tudo em um só lugar',
    caption: 'Rendas, gastos, contas fixas e insights — a foto real do seu mês.',
    durationMs: 7200,
    kenBurns: 'in',
    cues: [
      { atMs: 350, kind: 'impact' },
      { atMs: 1800, kind: 'click', x: 91, y: 17 },
      { atMs: 3200, kind: 'click', x: 48, y: 38 },
      { atMs: 4800, kind: 'click', x: 52, y: 72 },
    ],
  },
  {
    id: 'cards',
    image: '/landing/walkthrough/cards.png',
    label: 'Cartões',
    impact: 'Faturas que batem',
    caption: 'Limites, vencimentos, lançamentos e importação OFX no app real.',
    durationMs: 6500,
    kenBurns: 'pan-right',
    cues: [
      { atMs: 300, kind: 'impact' },
      { atMs: 2000, kind: 'click', x: 72, y: 28 },
      { atMs: 3800, kind: 'click', x: 45, y: 55 },
    ],
  },
  {
    id: 'invest',
    image: '/landing/walkthrough/investments.png',
    label: 'Investidor',
    impact: 'Do CDI à bolsa',
    caption: 'Cotações, maiores altas e baixas — a tela de investimentos de verdade.',
    durationMs: 6800,
    kenBurns: 'out',
    cues: [
      { atMs: 300, kind: 'impact' },
      { atMs: 2200, kind: 'click', x: 38, y: 22 },
      { atMs: 4200, kind: 'click', x: 62, y: 48 },
    ],
  },
  {
    id: 'assistant',
    image: '/landing/walkthrough/assistant.png',
    label: 'Assistente',
    impact: 'Fale ou digite',
    caption: '“Gastei 45 no mercado” — registre em português, como no dia a dia.',
    durationMs: 7500,
    kenBurns: 'in',
    cues: [
      { atMs: 300, kind: 'impact' },
      { atMs: 1400, kind: 'click', x: 93, y: 88 },
      { atMs: 2600, kind: 'type' },
      { atMs: 4200, kind: 'send' },
      { atMs: 5200, kind: 'click', x: 78, y: 72 },
    ],
  },
  {
    id: 'goals',
    image: '/landing/walkthrough/goals.png',
    label: 'Metas',
    impact: 'Objetivos com prazo',
    caption: 'Progresso visual e clareza do quanto falta — sem planilha.',
    durationMs: 6500,
    kenBurns: 'pan-left',
    cues: [
      { atMs: 300, kind: 'impact' },
      { atMs: 2400, kind: 'click', x: 55, y: 42 },
      { atMs: 4400, kind: 'click', x: 82, y: 58 },
    ],
  },
]

const TOTAL_MS = SCENES.reduce((s, sc) => s + sc.durationMs, 0)

type Pulse = { id: number; x: number; y: number }

function getSceneProgress(globalMs: number) {
  const looped = globalMs % TOTAL_MS
  let acc = 0
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i]
    if (looped < acc + scene.durationMs) {
      return { index: i, localMs: looped - acc, scene, looped }
    }
    acc += scene.durationMs
  }
  const last = SCENES[SCENES.length - 1]
  return { index: SCENES.length - 1, localMs: 0, scene: last, looped }
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function FluxWalkthroughVideo() {
  const [open, setOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [pulses, setPulses] = useState<Pulse[]>([])
  const [showImpact, setShowImpact] = useState(false)
  const rafRef = useRef<number>(0)
  const elapsedRef = useRef(0)
  const firedCuesRef = useRef('')
  const prevSceneRef = useRef(0)
  const pulseIdRef = useRef(0)

  const { index: sceneIndex, localMs, scene, looped } = getSceneProgress(elapsed)
  const progress = (looped / TOTAL_MS) * 100

  const addPulse = useCallback((x: number, y: number) => {
    const id = ++pulseIdRef.current
    setPulses((prev) => [...prev, { id, x, y }])
    window.setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.id !== id))
    }, 700)
  }, [])

  const handleCue = useCallback(
    (cue: SceneCue) => {
      if (muted) return
      switch (cue.kind) {
        case 'click':
          if (cue.x != null && cue.y != null) addPulse(cue.x, cue.y)
          void playWalkthroughClick()
          break
        case 'impact':
          setShowImpact(true)
          window.setTimeout(() => setShowImpact(false), 2200)
          void playWalkthroughImpact()
          break
        case 'type':
          void playWalkthroughKey()
          window.setTimeout(() => void playWalkthroughKey(), 90)
          window.setTimeout(() => void playWalkthroughKey(), 180)
          break
        case 'send':
          void playWalkthroughSend()
          break
        default:
          break
      }
    },
    [addPulse, muted],
  )

  const resetPlayback = useCallback(() => {
    setElapsed(0)
    elapsedRef.current = 0
    firedCuesRef.current = ''
    prevSceneRef.current = 0
    setPulses([])
    setShowImpact(false)
    setPlaying(true)
  }, [])

  const openModal = () => {
    resetPlayback()
    setOpen(true)
    document.body.style.overflow = 'hidden'
    if (!muted) {
      enterWalkthroughSounds()
      void startWalkthroughMusic()
    }
  }

  const closeModal = () => {
    setOpen(false)
    setPlaying(false)
    document.body.style.overflow = ''
    cancelAnimationFrame(rafRef.current)
    leaveWalkthroughSounds()
    stopWalkthroughMusic()
  }

  useEffect(() => {
    if (!open || !playing) return

    let cancelled = false
    const start = performance.now() - elapsedRef.current

    const tick = () => {
      if (cancelled) return
      const total = performance.now() - start
      elapsedRef.current = total
      setElapsed(total)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [open, playing])

  useEffect(() => {
    if (!open || !playing) return

    const prevLooped = (elapsed - 16) % TOTAL_MS
    if (looped < prevLooped) firedCuesRef.current = ''

    if (sceneIndex !== prevSceneRef.current) {
      if (!muted && prevSceneRef.current !== sceneIndex) void playWalkthroughWhoosh()
      prevSceneRef.current = sceneIndex
    }

    for (let ci = 0; ci < scene.cues.length; ci++) {
      const cue = scene.cues[ci]
      const key = `${sceneIndex}-${ci}`
      if (localMs >= cue.atMs && !firedCuesRef.current.includes(`${key},`)) {
        firedCuesRef.current += `${key},`
        handleCue(cue)
      }
    }
  }, [elapsed, open, playing, sceneIndex, localMs, scene, looped, handleCue, muted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m
      if (next) {
        leaveWalkthroughSounds()
        stopWalkthroughMusic()
      } else if (open) {
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
            Telas reais do app — visão geral, cartões, investidor, assistente e metas — com trilha suave,
            efeitos nos cliques e frases de impacto, no estilo dos melhores SaaS.
          </p>
          <ul>
            <li>Capturas do sistema de verdade</li>
            <li>Assistente: falar ou digitar</li>
            <li>Trilha + efeitos sonoros discretos</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Ver como funciona <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Reproduzir tour do Flux">
          <div className="lp-wt-poster-frame">
            <img src="/landing/walkthrough/overview.png" alt="" className="lp-wt-poster-img" />
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">{formatTime(TOTAL_MS)}</span>
          </div>
          <span className="lp-wt-poster-caption">Demonstração · trilha e efeitos</span>
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
              <div className="lp-wt-cinema" key={scene.id}>
                <div
                  className={`lp-wt-slide lp-wt-slide--${scene.kenBurns}`}
                  style={{
                    backgroundImage: `url(${scene.image})`,
                    animationDuration: `${scene.durationMs}ms`,
                  }}
                />
                <div className="lp-wt-vignette" aria-hidden />
                {showImpact ? <p className="lp-wt-impact">{scene.impact}</p> : null}
                {pulses.map((p) => (
                  <span
                    key={p.id}
                    className="lp-wt-click-pulse"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    aria-hidden
                  />
                ))}
                <div className="lp-wt-subtitles">
                  <span>{scene.label}</span>
                  <p>{scene.caption}</p>
                </div>
              </div>
            </div>

            <footer className="lp-wt-controls">
              <button
                type="button"
                className="lp-wt-ctrl-play"
                aria-label={playing ? 'Pausar' : 'Reproduzir'}
                onClick={() => {
                  if (playing) {
                    setPlaying(false)
                    cancelAnimationFrame(rafRef.current)
                  } else {
                    setPlaying(true)
                  }
                }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <span className="lp-wt-time">{formatTime(looped)}</span>
              <div className="lp-wt-progress" aria-hidden>
                <i style={{ width: `${progress}%` }} />
              </div>
              <span className="lp-wt-time">{formatTime(TOTAL_MS)}</span>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
