import { useCallback, useEffect, useRef, useState } from 'react'
import './fluxWalkthroughVideo.css'

type SceneId = 'overview' | 'cards' | 'invest' | 'assistant' | 'goals'

type Scene = {
  id: SceneId
  label: string
  title: string
  caption: string
  durationMs: number
}

const SCENES: Scene[] = [
  {
    id: 'overview',
    label: 'Visão geral',
    title: 'Tudo em um só lugar',
    caption: 'Receitas, gastos, saldo e categorias do mês — clareza em segundos.',
    durationMs: 5500,
  },
  {
    id: 'cards',
    label: 'Cartões',
    title: 'Faturas sob controle',
    caption: 'Limites, vencimentos, parcelas e importação OFX sem planilha.',
    durationMs: 5500,
  },
  {
    id: 'invest',
    label: 'Investidor',
    title: 'Do CDI à bolsa',
    caption: 'Cotações ao vivo, maiores altas e baixas, FIIs, ETFs e cripto.',
    durationMs: 6000,
  },
  {
    id: 'assistant',
    label: 'Assistente',
    title: 'Registre falando ou digitando',
    caption: '“Gastei 45 reais no mercado” — o Flux categoriza sozinho.',
    durationMs: 5500,
  },
  {
    id: 'goals',
    label: 'Metas',
    title: 'Objetivos com prazo',
    caption: 'Progresso visual, depósitos e clareza do quanto falta.',
    durationMs: 5500,
  },
]

const TOTAL_MS = SCENES.reduce((s, sc) => s + sc.durationMs, 0)

function SceneMock({ id }: { id: SceneId }) {
  if (id === 'overview') {
    return (
      <div className="lp-wt-mock lp-wt-mock--overview">
        <div className="lp-wt-mock-bar">
          <span>Flux</span>
          <small>Agosto 2026</small>
        </div>
        <div className="lp-wt-mock-stats">
          <div><span>Receitas</span><b className="green">R$ 8.500</b></div>
          <div><span>Gastos</span><b className="red">R$ 4.212</b></div>
          <div><span>Saldo</span><b className="green">+ R$ 4.288</b></div>
        </div>
        <div className="lp-wt-mock-chart">
          <i style={{ height: '72%' }} />
          <i style={{ height: '48%' }} className="hot" />
          <i style={{ height: '58%' }} />
          <i style={{ height: '38%' }} />
        </div>
      </div>
    )
  }
  if (id === 'cards') {
    return (
      <div className="lp-wt-mock lp-wt-mock--cards">
        <div className="lp-wt-cc">
          <span>Nubank · Crédito</span>
          <strong>R$ 2.168,05</strong>
          <small>Fatura estimada · vence dia 12</small>
          <div className="lp-wt-prog"><i style={{ width: '8%' }} /></div>
        </div>
      </div>
    )
  }
  if (id === 'invest') {
    return (
      <div className="lp-wt-mock lp-wt-mock--invest">
        <div className="lp-wt-mover">
          <b>PETR4</b><span className="green">+1,99%</span><strong>R$ 43,55</strong>
        </div>
        <div className="lp-wt-mover">
          <b>VALE3</b><span className="green">+1,12%</span><strong>R$ 58,90</strong>
        </div>
        <div className="lp-wt-mover">
          <b>MGLU3</b><span className="red">−4,55%</span><strong>R$ 8,42</strong>
        </div>
        <small className="lp-wt-live">● tempo real · ~10s</small>
      </div>
    )
  }
  if (id === 'assistant') {
    return (
      <div className="lp-wt-mock lp-wt-mock--assistant">
        <div className="lp-wt-bubble user">Gastei 187 reais no mercado hoje</div>
        <div className="lp-wt-bubble bot">
          Anotado em <b>Alimentação</b> · Mercado Extra · − R$ 187,00
        </div>
      </div>
    )
  }
  return (
    <div className="lp-wt-mock lp-wt-mock--goals">
      <div className="lp-wt-goal">
        <b>Viagem Europa</b>
        <span>64% · R$ 8.000 de R$ 12.500</span>
        <div className="lp-wt-prog"><i style={{ width: '64%' }} /></div>
      </div>
      <div className="lp-wt-goal">
        <b>Reserva emergência</b>
        <span>91% · R$ 18.200 de R$ 20.000</span>
        <div className="lp-wt-prog green"><i style={{ width: '91%' }} /></div>
      </div>
    </div>
  )
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function FluxWalkthroughVideo() {
  const [open, setOpen] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const rafRef = useRef<number>(0)
  const elapsedRef = useRef(0)

  const scene = SCENES[sceneIndex]
  const progress = Math.min(100, (elapsed / TOTAL_MS) * 100)

  const resetPlayback = useCallback(() => {
    setSceneIndex(0)
    setElapsed(0)
    elapsedRef.current = 0
    setPlaying(true)
  }, [])

  const resolveSceneIndex = (ms: number) => {
    let acc = 0
    for (let i = 0; i < SCENES.length; i++) {
      acc += SCENES[i].durationMs
      if (ms < acc) return i
    }
    return SCENES.length - 1
  }

  const openModal = () => {
    resetPlayback()
    setOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setOpen(false)
    setPlaying(false)
    document.body.style.overflow = ''
    cancelAnimationFrame(rafRef.current)
  }

  useEffect(() => {
    if (!open || !playing) return

    let cancelled = false
    const start = performance.now() - elapsedRef.current

    const tick = () => {
      if (cancelled) return
      const total = performance.now() - start
      const looped = total % TOTAL_MS
      elapsedRef.current = looped
      setElapsed(looped)
      setSceneIndex(resolveSceneIndex(looped))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [open, playing])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <section className="lp-wt-section" id="como-funciona">
        <div className="lp-wt-section-copy">
          <span className="lp-kicker">Tour em vídeo</span>
          <h2>Entenda como funciona o Flux</h2>
          <p>
            Visão geral, cartões, investidor, assistente e metas — o essencial do app em pouco mais de meio minuto,
            no estilo de um walkthrough.
          </p>
          <ul>
            <li>Finanças do dia a dia num painel só</li>
            <li>Investidor com cotações ao vivo</li>
            <li>Assistente em português natural</li>
          </ul>
          <button type="button" className="lp-primary" onClick={openModal}>
            Ver como funciona <span aria-hidden>▶</span>
          </button>
        </div>

        <button type="button" className="lp-wt-poster" onClick={openModal} aria-label="Reproduzir tour do Flux">
          <div className="lp-wt-poster-frame">
            <SceneMock id="overview" />
            <div className="lp-wt-poster-dim" />
            <span className="lp-wt-play">
              <i aria-hidden>▶</i>
            </span>
            <span className="lp-wt-poster-tag">0:{Math.ceil(TOTAL_MS / 1000)}</span>
          </div>
          <span className="lp-wt-poster-caption">Demonstração · sem áudio</span>
        </button>
      </section>

      {open ? (
        <div className="lp-wt-modal" role="dialog" aria-modal aria-label="Tour do Flux">
          <div className="lp-wt-modal-backdrop" onClick={closeModal} aria-hidden />
          <div className="lp-wt-modal-panel">
            <header className="lp-wt-modal-head">
              <b>Entenda como funciona o Flux</b>
              <button type="button" className="lp-wt-close" onClick={closeModal} aria-label="Fechar">
                ✕
              </button>
            </header>

            <div className="lp-wt-player">
              <div className="lp-wt-player-stage" key={scene.id}>
                <p className="lp-wt-scene-kicker">{scene.label}</p>
                <h3>{scene.title}</h3>
                <p className="lp-wt-scene-caption">{scene.caption}</p>
                <SceneMock id={scene.id} />
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
              <span className="lp-wt-time">{formatTime(elapsed)}</span>
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
