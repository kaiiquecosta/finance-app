import { useEffect, useRef, useState } from 'react'
import './assistantDemo.css'

type Phase =
  | 'idle'
  | 'typing'
  | 'sent'
  | 'thinking'
  | 'done'
  | 'balance'

const USER_TEXT = 'Gastei 45 reais no mercado'
const ASSISTANT_REPLY = 'Pronto! Registrado em Mercado.'
const BALANCE_BEFORE = 4120
const AMOUNT = 45
const WAVE = [18, 34, 52, 28, 66, 45, 24, 58, 38, 20]

export function AssistantDemo() {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [typed, setTyped] = useState('')
  const [balance, setBalance] = useState(BALANCE_BEFORE)
  const [speaking, setSpeaking] = useState(false)
  const loopRef = useRef(0)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true)
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return

    let cancelled = false
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          if (!cancelled) resolve()
        }, ms)
      })

    async function runLoop() {
      while (!cancelled) {
        setPhase('idle')
        setTyped('')
        setBalance(BALANCE_BEFORE)
        setSpeaking(false)
        await wait(800)

        setSpeaking(true)
        setPhase('typing')
        for (let i = 1; i <= USER_TEXT.length; i++) {
          if (cancelled) return
          setTyped(USER_TEXT.slice(0, i))
          await wait(42)
        }
        await wait(300)
        setSpeaking(false)

        setPhase('sent')
        await wait(650)

        setPhase('thinking')
        await wait(850)

        setPhase('done')
        await wait(900)

        setPhase('balance')
        setBalance(BALANCE_BEFORE - AMOUNT)
        await wait(2800)

        loopRef.current += 1
        if (loopRef.current % 2 === 0) await wait(500)
      }
    }

    void runLoop()
    return () => {
      cancelled = true
    }
  }, [active])

  const showUserBubble = phase === 'sent' || phase === 'thinking' || phase === 'done' || phase === 'balance'
  const showAssistant = phase === 'done' || phase === 'balance'
  const showTx = phase === 'balance'
  const showBalance = phase === 'balance'

  return (
    <section className="lp-assistant lp-assistant-below-hero" ref={rootRef} id="assistente" aria-label="Demonstração do Assistente Flux">
      <div className="lp-assistant-layout">
        <div className="lp-assistant-copy">
          <div className={`lp-assist-wave ${speaking ? 'active' : ''}`} aria-hidden>
            {WAVE.map((h, i) => (
              <i key={i} style={{ height: h }} />
            ))}
          </div>
          <span className="lp-kicker">Assistente Flux</span>
          <h2>Fale como você vive.<br /><em>O Flux registra.</em></h2>
          <p>
            Digite ou fale em português — gastos e receitas entram sozinhos, sem formulário.
            A demonstração roda automaticamente ao lado.
          </p>
        </div>

        <div className="lp-assistant-stage">
          <div className="lp-assist-panel" aria-live="polite">
            <header className="lp-assist-head">
              <div>
                <b>Assistente</b>
                <small>Registre gastos e receitas</small>
              </div>
              <span className="lp-assist-close" aria-hidden>✕</span>
            </header>

            <div className="lp-assist-chat">
              <div className="lp-assist-bubble bot">
                Oi! Digite ou fale em português. Ex.: 10 reais coxinha · gastei 45 no uber · recebi 500
              </div>

              {showUserBubble && (
                <div className="lp-assist-bubble user lp-assist-pop">{USER_TEXT}</div>
              )}

              {phase === 'thinking' && (
                <div className="lp-assist-bubble bot lp-assist-typing">
                  <span /><span /><span />
                </div>
              )}

              {showAssistant && (
                <div className="lp-assist-bubble bot lp-assist-pop">{ASSISTANT_REPLY}</div>
              )}

              {showTx && (
                <div className="lp-assist-tx lp-assist-pop">
                  <span>🛒 Mercado</span>
                  <strong>− R$ 45,00</strong>
                </div>
              )}

              {showBalance && (
                <div className="lp-assist-balance-inline lp-assist-pop">
                  <span className="lp-assist-balance-icon">🏦</span>
                  <div className="lp-assist-balance-copy">
                    <small>Nubank · saldo após o gasto</small>
                    <b>R$ {balance.toLocaleString('pt-BR')},00</b>
                  </div>
                  <em className="lp-assist-delta">− R$ 45,00</em>
                </div>
              )}
            </div>

            <div className="lp-assist-compose">
              <button type="button" className={`lp-assist-mic ${speaking ? 'active' : ''}`} aria-hidden>🎤</button>
              <div className="lp-assist-input">
                {phase === 'typing' ? (
                  <>
                    {typed}
                    <i className="lp-assist-caret" />
                  </>
                ) : (
                  <span className="lp-assist-placeholder">Ex.: 10 reais coxinha</span>
                )}
              </div>
              <button type="button" className="lp-assist-send" aria-hidden>↑</button>
            </div>
          </div>

          <div className="lp-assist-fab" aria-hidden>💬</div>
        </div>
      </div>
    </section>
  )
}
