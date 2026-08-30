import { useEffect, useRef, useState } from 'react'
import { ensureLandingAudioReady, playKeyTap, playLikeSfx, playNotifySfx, playSendSfx } from './landingSounds'
import { useScrollVisible } from './useScrollVisible'
import './communityDemo.css'

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
    body: `Sua sugestão entrou em Faremos. Priorizamos pelo interesse de quem usa o app.`,
  },
  cooking: {
    icon: '🍳',
    title: 'Estamos cozinhando sua ideia',
    body: `O Flux está desenvolvendo “${SUGGESTION}”. Assim que estiver pronto, avisamos.`,
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
      {cooking ? <em className="lp-comm-cooking-badge">🍳 cozinhando</em> : null}
    </div>
  )
}

export function CommunityDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useScrollVisible(rootRef, 0.45)
  const [phase, setPhase] = useState<Phase>('idle')
  const [typed, setTyped] = useState('')
  const [cardCol, setCardCol] = useState<CardCol | null>(null)
  const [likes, setLikes] = useState(0)
  const [likeBump, setLikeBump] = useState(false)
  const [notif, setNotif] = useState<NotifKind | null>(null)
  const [cardMoving, setCardMoving] = useState(false)

  useEffect(() => {
    if (!inView) return
    void ensureLandingAudioReady()
  }, [inView])

  useEffect(() => {
    if (inView) return
    setPhase('idle')
    setTyped('')
    setCardCol(null)
    setLikes(0)
    setLikeBump(false)
    setNotif(null)
    setCardMoving(false)
  }, [inView])

  useEffect(() => {
    if (!inView) return

    let cancelled = false
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          if (!cancelled) resolve()
        }, ms)
      })

    const bumpLike = async (next: number) => {
      setLikes(next)
      setLikeBump(true)
      playLikeSfx()
      await wait(320)
      setLikeBump(false)
    }

    const animateLikes = async (from: number, to: number, stepMs = 420) => {
      for (let n = from + 1; n <= to; n++) {
        if (cancelled) return
        await bumpLike(n)
        if (n < to) await wait(stepMs)
      }
    }

    const moveCard = async (col: CardCol) => {
      setCardMoving(true)
      await wait(180)
      setCardCol(col)
      await wait(420)
      setCardMoving(false)
    }

    async function runLoop() {
      await ensureLandingAudioReady()
      while (!cancelled) {
        setPhase('idle')
        setTyped('')
        setCardCol(null)
        setLikes(0)
        setLikeBump(false)
        setNotif(null)
        setCardMoving(false)
        await wait(900)

        setPhase('highlight')
        await wait(700)

        setPhase('modal')
        await wait(500)

        setPhase('typing')
        for (let i = 1; i <= SUGGESTION.length; i++) {
          if (cancelled) return
          setTyped(SUGGESTION.slice(0, i))
          playKeyTap()
          await wait(36)
        }
        await wait(450)

        setPhase('submit')
        playSendSfx()
        setCardCol('backlog')
        await wait(650)

        setPhase('backlog-likes')
        await animateLikes(0, 2, 380)
        await wait(500)

        setPhase('to-planned')
        await moveCard('planned')
        setNotif('planned')
        playNotifySfx()
        await wait(2200)
        setNotif(null)

        setPhase('planned-likes')
        await animateLikes(2, 6, 360)
        await wait(600)

        setPhase('to-cooking')
        await moveCard('cooking')
        setNotif('cooking')
        playNotifySfx()
        setPhase('cooking')
        await wait(2400)
        setNotif(null)

        setPhase('to-done')
        await moveCard('done')
        await wait(700)

        setPhase('notify')
        setNotif('done')
        playNotifySfx()
        setPhase('hold')
        await wait(3600)
        setNotif(null)
        await wait(800)
      }
    }

    void runLoop()
    return () => {
      cancelled = true
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
          <h4>Backlog</h4>
          {!cardCol ? <i>Adicionar sugestão +</i> : null}
          {cardCol === 'backlog' ? renderAnimatedCard() : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'planned' ? ' active' : ''}`}>
          <h4>Faremos</h4>
          {cardCol === 'planned' ? renderAnimatedCard() : null}
          {cardCol === null || cardCol === 'backlog' ? (
            <em className="lp-comm-empty">Aguardando prioridade</em>
          ) : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'cooking' ? ' active' : ''}`}>
          <h4>Cozinhando</h4>
          {cardCol === 'cooking' ? renderAnimatedCard() : null}
          {cardCol !== 'cooking' ? <em className="lp-comm-empty">Vazio</em> : null}
        </div>

        <div className={`lp-comm-col${cardCol === 'done' ? ' active' : ''}`}>
          <h4>Pronto</h4>
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
