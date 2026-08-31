import { useEffect, useRef, useState } from 'react'
import { communityColumnTitle } from '@/domain/community'
import {
  playKeyTap,
  playLikeSfx,
  playNotifySfx,
  playSendSfx,
  stopLandingDemoSfx,
} from './landingSounds'
import { useLandingDemoSession } from './useLandingDemoSession'
import './communityDemo.css'
import './landingHints.css'

type Phase =
  | 'idle'
  | 'highlight'
  | 'modal'
  | 'typing'
  | 'submit'
  | 'backlog-likes'
  | 'to-planned'
  | 'planned-likes'
  | 'to-cooking'
  | 'cooking'
  | 'to-done'
  | 'notify'
  | 'hold'

type CardCol = 'backlog' | 'planned' | 'cooking' | 'done'
type NotifKind = 'planned' | 'cooking' | 'done'

const SUGGESTION = 'Queria uma parte de investimentos'
const DONE_CARD = 'Ajustar responsividade da comunidade'

const NOTIF_COPY: Record<NotifKind, { icon: string; title: string; body: string }> = {
  planned: {
    icon: '📋',
    title: 'Flux vai desenvolver seu pedido',
    body: `Sua sugestão entrou em ${communityColumnTitle('planned')}. Priorizamos pelo interesse de quem usa o app.`,
  },
  cooking: {
    icon: '🔧',
    title: 'Estamos desenvolvendo sua ideia',
    body: `O Flux está trabalhando em “${SUGGESTION}”. Assim que estiver pronto, avisamos.`,
  },
  done: {
    icon: '✅',
    title: 'Seu pedido ficou pronto',
    body: `“${SUGGESTION}” já está disponível no app. Vale testar e nos contar o que achou!`,
  },
}

function KanbanCard({
  title,
  likes,
  bump,
  cooking,
}: {
  title: string
  likes: number
  bump?: boolean
  cooking?: boolean
}) {
  return (
    <div className={`lp-comm-card lp-comm-pop${cooking ? ' is-cooking' : ''}`}>
      <b>{title}</b>
      <footer>
        <span className={`lp-comm-like${bump ? ' bump' : ''}`}>♡ {likes}</span>
      </footer>
      {cooking ? <em className="lp-comm-cooking-badge">⚙️ em desenvolvimento</em> : null}
    </div>
  )
}

function resetCommunityDemoState(setters: {
  setPhase: (p: Phase) => void
  setTyped: (v: string) => void
  setCardCol: (v: CardCol | null) => void
  setLikes: (v: number) => void
  setLikeBump: (v: boolean) => void
  setNotif: (v: NotifKind | null) => void
  setCardMoving: (v: boolean) => void
}) {
  setters.setPhase('idle')
  setters.setTyped('')
  setters.setCardCol(null)
  setters.setLikes(0)
  setters.setLikeBump(false)
  setters.setNotif(null)
  setters.setCardMoving(false)
}

export function CommunityDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { inView, inViewRef } = useLandingDemoSession(rootRef, {
    topMax: 0.46,
    bottomMin: 0.14,
    minVisiblePx: 180,
  })

  const [phase, setPhase] = useState<Phase>('idle')
  const [typed, setTyped] = useState('')
  const [cardCol, setCardCol] = useState<CardCol | null>(null)
  const [likes, setLikes] = useState(0)
  const [likeBump, setLikeBump] = useState(false)
  const [notif, setNotif] = useState<NotifKind | null>(null)
  const [cardMoving, setCardMoving] = useState(false)

  useEffect(() => {
    if (inView) return
    resetCommunityDemoState({
      setPhase,
      setTyped,
      setCardCol,
      setLikes,
      setLikeBump,
      setNotif,
      setCardMoving,
    })
    stopLandingDemoSfx()
  }, [inView])

  useEffect(() => {
    if (!inView) return

    let cancelled = false
    const alive = () => !cancelled && inViewRef.current

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          if (alive()) resolve()
        }, ms)
      })

    const bumpLike = async (next: number) => {
      if (!alive()) return
      setLikes(next)
      setLikeBump(true)
      if (alive()) playLikeSfx()
      await wait(320)
      if (alive()) setLikeBump(false)
    }

    const animateLikes = async (from: number, to: number, stepMs = 420) => {
      for (let n = from + 1; n <= to; n++) {
        if (!alive()) return
        await bumpLike(n)
        if (n < to) await wait(stepMs)
      }
    }

    const moveCard = async (col: CardCol) => {
      if (!alive()) return
      setCardMoving(true)
      await wait(180)
      if (!alive()) return
      setCardCol(col)
      await wait(420)
      if (alive()) setCardMoving(false)
    }

    async function runLoop() {
      while (alive()) {
        resetCommunityDemoState({
          setPhase,
          setTyped,
          setCardCol,
          setLikes,
          setLikeBump,
          setNotif,
          setCardMoving,
        })
        await wait(2600)
        if (!alive()) return

        setPhase('highlight')
        await wait(1500)
        if (!alive()) return

        setPhase('modal')
        await wait(500)
        if (!alive()) return

        setPhase('typing')
        for (let i = 1; i <= SUGGESTION.length; i++) {
          if (!alive()) return
          setTyped(SUGGESTION.slice(0, i))
          playKeyTap()
          await wait(36)
        }
        await wait(450)
        if (!alive()) return

        setPhase('submit')
        playSendSfx()
        setCardCol('backlog')
        await wait(650)
        if (!alive()) return

        setPhase('backlog-likes')
        await animateLikes(0, 2, 380)
        await wait(500)
        if (!alive()) return

        setPhase('to-planned')
        await moveCard('planned')
        if (!alive()) return
        setNotif('planned')
        playNotifySfx()
        await wait(2200)
        if (!alive()) return
        setNotif(null)

        setPhase('planned-likes')
        await animateLikes(2, 6, 360)
        await wait(600)
        if (!alive()) return

        setPhase('to-cooking')
        await moveCard('cooking')
        if (!alive()) return
        setNotif('cooking')
        playNotifySfx()
        setPhase('cooking')
        await wait(2400)
        if (!alive()) return
        setNotif(null)

        setPhase('to-done')
        await moveCard('done')
        await wait(700)
        if (!alive()) return

        setPhase('notify')
        setNotif('done')
        playNotifySfx()
        setPhase('hold')
        await wait(3600)
        if (!alive()) return
        setNotif(null)
        await wait(800)
      }
    }

    void runLoop()
    return () => {
      cancelled = true
      stopLandingDemoSfx()
    }
  }, [inView])

  const showModal = inView && (phase === 'modal' || phase === 'typing' || phase === 'submit')
  const highlightBtn = inView && (phase === 'highlight' || showModal)
  const isCooking = cardCol === 'cooking' && (phase === 'cooking' || phase === 'to-done')

  const renderAnimatedCard = () => {
    if (!cardCol) return null
    return (
      <div className={`lp-comm-card-slot${cardMoving ? ' moving' : ''}`}>
        <KanbanCard title={SUGGESTION} likes={likes} bump={likeBump} cooking={isCooking} />
      </div>
    )
  }

  return (
    <div
      className="lp-showcase-mock lp-showcase-kanban lp-community-demo"
      ref={rootRef}
      aria-live={inView ? 'polite' : 'off'}
    >
      <div className="lp-community-watch-banner lp-community-watch-banner--fixed" role="status">
        <span className="lp-community-watch-banner__eyebrow">Demonstração automática</span>
        <p className="lp-community-watch-banner__title">Como funciona a comunidade</p>
        <p className="lp-community-watch-banner__body">
          A sequência abaixo roda sozinha — é só acompanhar sugestão, votos e entrega.
        </p>
      </div>
      <div className="lp-sm-kanban-head">
        <b>Comunidade</b>
        <span className={highlightBtn ? 'pulse' : ''}>＋ Nova sugestão</span>
      </div>

      {showModal ? (
        <div className="lp-comm-modal lp-comm-pop" role="dialog" aria-label="Nova sugestão">
          <header>
            <b>Nova sugestão</b>
            <span aria-hidden>✕</span>
          </header>
          <label>
            <small>Título</small>
            <div className="lp-comm-modal-input">
              {phase === 'typing' || phase === 'submit' ? (
                <>
                  {typed}
                  {phase === 'typing' ? <i className="lp-comm-caret" /> : null}
                </>
              ) : (
                <span className="muted">Ex.: integração com banco X</span>
              )}
            </div>
          </label>
          <footer>
            <button type="button" className={phase === 'submit' ? 'sent' : ''}>
              {phase === 'submit' ? 'Enviado ✓' : 'Publicar sugestão'}
            </button>
          </footer>
        </div>
      ) : null}

      <div className="lp-sm-kanban-cols">
        <div className={`lp-comm-col${cardCol === 'backlog' ? ' active' : ''}`}>
          <h4>{communityColumnTitle('backlog')}</h4>
          {!cardCol ? <i>Adicionar sugestão +</i> : null}
          {cardCol === 'backlog' ? renderAnimatedCard() : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'planned' ? ' active' : ''}`}>
          <h4>{communityColumnTitle('planned')}</h4>
          {cardCol === 'planned' ? renderAnimatedCard() : null}
          {cardCol === null || cardCol === 'backlog' ? (
            <em className="lp-comm-empty">Aguardando prioridade</em>
          ) : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'cooking' ? ' active' : ''}`}>
          <h4>{communityColumnTitle('in_progress', true)}</h4>
          {cardCol === 'cooking' ? renderAnimatedCard() : null}
          {cardCol !== 'cooking' ? <em className="lp-comm-empty">Vazio</em> : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'done' ? ' active' : ''}`}>
          <h4>{communityColumnTitle('done')}</h4>
          <div className="lp-comm-card static">
            <b>{DONE_CARD}</b>
            <footer>
              <span>♡ 1</span>
            </footer>
          </div>
          {cardCol === 'done' ? renderAnimatedCard() : null}
        </div>
      </div>

      {inView && notif ? (
        <div className={`lp-comm-notif lp-comm-pop kind-${notif}`} role="status">
          <span className="lp-comm-notif-icon">{NOTIF_COPY[notif].icon}</span>
          <div>
            <strong>{NOTIF_COPY[notif].title}</strong>
            <p>{NOTIF_COPY[notif].body}</p>
          </div>
          <button type="button" aria-hidden>
            Entendi
          </button>
        </div>
      ) : null}
    </div>
  )
}
