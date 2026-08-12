import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TESTIMONIALS, avatarTone, initials } from './testimonials.data'
import { HeroFluxScene } from './landing/HeroFluxScene'
import { useLandingMotion } from './landing/useLandingMotion'
import './LandingPage.legacy.css'

/* ══════════════════════════════════════════════
   LANDING PAGE — porte fiel da landing legada
   (visível apenas para não-logados, rota "/")
   ══════════════════════════════════════════════ */

type TabId = 'ov' | 'tx' | 'inst' | 'sub' | 'cards' | 'bills' | 'goals' | 'inv'

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'ov', icon: '📊', label: 'Visão geral' },
  { id: 'tx', icon: '💸', label: 'Transações' },
  { id: 'inst', icon: '📅', label: 'Parcelas' },
  { id: 'sub', icon: '🔁', label: 'Assinaturas' },
  { id: 'cards', icon: '💳', label: 'Cartões' },
  { id: 'bills', icon: '🏠', label: 'Contas fixas' },
  { id: 'goals', icon: '🎯', label: 'Metas' },
  { id: 'inv', icon: '📈', label: 'Investimentos' },
]

const MONTHS = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar']
const RECEITAS = [7200, 6800, 8100, 7400, 7000, 7500]
const GASTOS = [3800, 4100, 3200, 3600, 3900, 3240]
const MAX_V = Math.max(...RECEITAS, ...GASTOS)

const TICKER_ITEMS: Array<{ icon: string; text: string; strong: string }> = [
  { icon: '💸', text: 'Controle de gastos', strong: 'em tempo real' },
  { icon: '💳', text: 'Faturas e limites', strong: 'sempre à vista' },
  { icon: '📈', text: 'CDI atualizado', strong: 'via Banco Central' },
  { icon: '🎯', text: 'Metas financeiras', strong: 'com progresso visual' },
  { icon: '☁️', text: 'Dados na nuvem', strong: 'PostgreSQL + RLS' },
  { icon: '📱', text: 'Celular e computador', strong: 'funciona em tudo' },
  { icon: '🔁', text: 'Assinaturas', strong: 'todas organizadas' },
  { icon: '🏦', text: 'Contas bancárias', strong: 'saldo consolidado' },
]

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Preciso de cartão de crédito para o trial?',
    a: 'Não. O trial de 30 dias é 100% gratuito. Você só precisa criar uma conta com email. O cartão só é pedido se decidir assinar o Pro depois.',
  },
  {
    q: 'Meus dados financeiros ficam seguros?',
    a: 'Sim. Dados no PostgreSQL com Row Level Security — nenhum outro usuário acessa seus dados. Autenticação JWT com expiração automática e renovação transparente.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. Web app responsivo que funciona em qualquer dispositivo. Adicione à tela inicial como app nativo — sem precisar instalar nada da App Store ou Play Store.',
  },
  {
    q: 'O que acontece com meus dados se eu cancelar?',
    a: 'Seus dados ficam salvos. Ao cancelar, você volta ao Free automaticamente sem perder nenhum histórico de transações, metas ou investimentos.',
  },
  {
    q: 'Como funciona o cálculo dos investimentos?',
    a: 'CDI atualizado diariamente via API do Banco Central. Rendimento calculado com juros compostos diários. IR regressivo de 22,5% a 15% automático conforme o prazo de aplicação.',
  },
  {
    q: 'Posso usar em vários dispositivos?',
    a: 'Sim. Seus dados ficam na nuvem (Supabase/PostgreSQL), então a mesma conta abre no celular, no tablet e no computador, sempre com o que está no servidor. O que é atualizado ao vivo são as cotações e o CDI, buscados direto das APIs públicas do Banco Central e de câmbio.',
  },
]

function ArrowRightIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  useLandingMotion(rootRef)

  const [tab, setTab] = useState<TabId>('ov')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [navMode, setNavMode] = useState<'' | 'dk' | 'lt'>('')
  const [navLoginVisible, setNavLoginVisible] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [balance, setBalance] = useState(0)

  const goRegister = (e: MouseEvent) => {
    e.preventDefault()
    navigate('/criar-conta')
  }
  const goLogin = (e: MouseEvent) => {
    e.preventDefault()
    navigate('/entrar')
  }
  const closeMobAnd = (fn?: (e: MouseEvent) => void) => (e: MouseEvent) => {
    setMobileOpen(false)
    fn?.(e)
  }

  // dispara as animações do mockup (saldo, barras, faturas, metas) uma vez, ao montar
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!revealed) return
    let raf = 0
    const start = performance.now()
    const dur = 1100
    function step(now: number) {
      const t = Math.min((now - start) / dur, 1)
      const ev = 1 - Math.pow(1 - t, 3)
      setBalance(Math.round(8420 * ev))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [revealed])

  // trava o scroll do body enquanto o menu mobile está aberto
  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // troca a cor da nav (transparente/dark/light) conforme o scroll, igual ao legado
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    function isDark() {
      const hero = root!.querySelector<HTMLElement>('.hero')
      const heroH = hero?.offsetHeight || window.innerHeight
      const s = window.scrollY
      if (s < heroH - 60) return true
      const decks = root!.querySelectorAll('.dsec-wrap,.fcta-wrap')
      for (const ds of Array.from(decks)) {
        const r = ds.getBoundingClientRect()
        if (r.top < 60 && r.bottom > 60) return true
      }
      const tw = root!.querySelector('.ticker-wrap')
      if (tw) {
        const r = tw.getBoundingClientRect()
        if (r.top < 60 && r.bottom > 60) return true
      }
      return false
    }

    function onScroll() {
      const s = window.scrollY
      if (s < 20) {
        setNavMode('')
        setNavLoginVisible(false)
      } else if (isDark()) {
        setNavMode('dk')
        setNavLoginVisible(true)
      } else {
        setNavMode('lt')
        setNavLoginVisible(true)
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const balanceText = 'R$ ' + balance.toLocaleString('pt-BR')
  const ltSuffix = navMode === 'lt' ? ' lt' : ''

  return (
    <div className="landing-root" ref={rootRef}>
      {/* MOBILE MENU */}
      <div className={`mob${mobileOpen ? ' open' : ''}`}>
        <button className="mob-x" type="button" onClick={() => setMobileOpen(false)}>
          ✕
        </button>
        <a href="#funcionalidades" onClick={() => setMobileOpen(false)}>
          Funcionalidades
        </a>
        <a href="#investimentos" onClick={() => setMobileOpen(false)}>
          Investimentos
        </a>
        <a href="#precos" onClick={() => setMobileOpen(false)}>
          Preços
        </a>
        <a href="#faq" onClick={() => setMobileOpen(false)}>
          FAQ
        </a>
        <a
          href="/criar-conta"
          onClick={closeMobAnd(goRegister)}
          className="cta-wh"
          style={{ fontSize: 15, padding: '13px 28px', marginTop: 8 }}
        >
          Começar grátis →
        </a>
      </div>

      {/* NAV */}
      <nav className={`nav${navMode ? ' ' + navMode : ''}`}>
        <ul className={`nlinks${ltSuffix}`}>
          <li>
            <a href="#funcionalidades">Funcionalidades</a>
          </li>
          <li>
            <a href="#investimentos">Investimentos</a>
          </li>
          <li>
            <a href="#precos">Preços</a>
          </li>
        </ul>
        <a href="#" className={`nlogo${ltSuffix}`}>
          <div className="nlogo-mark">F</div>Flux
        </a>
        <div className="nright">
          <a
            href="/entrar"
            onClick={goLogin}
            className="nb"
            style={{ display: navLoginVisible ? 'inline-flex' : 'none' }}
          >
            Entrar
          </a>
          <a href="#faq" className={`nb${ltSuffix}`}>
            FAQ
          </a>
          <a href="/criar-conta" onClick={goRegister} className={`nb sol${ltSuffix}`}>
            Começar grátis
          </a>
          <button
            className={`ham${ltSuffix}`}
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* ══════════ HERO (DARK) ══════════ */}
      <section className="hero">
        <div className="hero-scene-stack" aria-hidden>
          <div className="hero-orb-fallback" />
          <HeroFluxScene />
          <div className="hero-scrim" />
          <div className="hero-vignette" />
        </div>
        <div className="hgrid"></div>
        <div className="hglow hg1"></div>
        <div className="hglow hg2"></div>
        <div className="hglow hg3"></div>

        <div className="hero-c">
          <div className="pill" data-motion="hero-pill">
            <div className="pill-dot"></div>30 dias grátis — sem cartão de crédito
          </div>
          <h1 data-motion="hero-title">
            Suas finanças,
            <br />
            <span className="thin">finalmente</span>
            <br />
            <span className="accent">claras.</span>
          </h1>
          <p className="hero-sub" data-motion="hero-copy">
            Do gasto diário ao investimento de longo prazo.
            <br />
            <b>Tudo em um lugar, para qualquer dispositivo.</b>
          </p>
          <div className="hero-ctas" data-motion="hero-actions">
            <a href="/criar-conta" onClick={goRegister} className="cta-wh">
              Abrir conta Flux
              <ArrowRightIcon />
            </a>
            <a href="#funcionalidades" className="cta-ghost">
              Ver funcionalidades
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </a>
          </div>
          <div className="hero-notes" data-motion="hero-notes">
            <span>Sem cartão</span>
            <span>Cancele quando quiser</span>
            <span>Só você acessa seus dados</span>
          </div>

          {/* APP MOCKUP */}
          <div className="mock" data-motion="hero-mock">
            <div className="mock-frame">
              <div className="chrome">
                <div className="cdots">
                  <div className="cd" style={{ background: '#ff5f57' }}></div>
                  <div className="cd" style={{ background: '#febc2e' }}></div>
                  <div className="cd" style={{ background: '#28c840' }}></div>
                </div>
                <div className="url-b">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={2} strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  finance-app-one-weld.vercel.app
                </div>
              </div>
              <div className="abar">
                <div className="alg">
                  <div className="alg-mark">F</div>
                  <div className="alg-name">Flux</div>
                </div>
                <div className="atabs">
                  {TABS.map((t) => (
                    <div
                      key={t.id}
                      className={`atab${tab === t.id ? ' on' : ''}`}
                      onClick={() => setTab(t.id)}
                    >
                      <span className="atab-i">{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="acon">
                {/* VISÃO GERAL */}
                <div className={`vw${tab === 'ov' ? ' on' : ''}`}>
                  <div className="ov-top">
                    <div className="ov-lbl">Patrimônio total</div>
                    <div className="ov-bal">{balanceText}</div>
                    <div className="ov-chg">↑ 12,4% este mês</div>
                    <div className="ov-accs">
                      <div className="ov-acc">
                        <div className="ov-acc-b">Nubank</div>
                        <div className="ov-acc-v">R$ 4.120</div>
                      </div>
                      <div className="ov-acc">
                        <div className="ov-acc-b">Inter</div>
                        <div className="ov-acc-v">R$ 2.100</div>
                      </div>
                      <div className="ov-acc">
                        <div className="ov-acc-b">C6 Bank</div>
                        <div className="ov-acc-v">R$ 2.200</div>
                      </div>
                    </div>
                  </div>
                  <div className="ov-graph">
                    <div className="ov-gh">
                      <div className="ov-gt">Receitas × Gastos — últimos 6 meses</div>
                      <div className="ov-gleg">
                        <div className="gl">
                          <div className="gl-d" style={{ background: 'var(--g)' }}></div>Receitas
                        </div>
                        <div className="gl">
                          <div className="gl-d" style={{ background: '#ff6060' }}></div>Gastos
                        </div>
                      </div>
                    </div>
                    <div className="bars">
                      {MONTHS.map((m, i) => (
                        <div className="bg-wrap" key={m}>
                          <div className="bpair">
                            <div
                              className="b"
                              style={{
                                width: '46%',
                                background: 'rgba(61,220,132,.35)',
                                height: revealed ? `${(RECEITAS[i] / MAX_V) * 48}px` : 0,
                                transitionDelay: `${i * 0.06}s`,
                              }}
                            ></div>
                            <div
                              className="b"
                              style={{
                                width: '46%',
                                background: 'rgba(255,96,96,.3)',
                                height: revealed ? `${(GASTOS[i] / MAX_V) * 48}px` : 0,
                                transitionDelay: `${i * 0.06 + 0.04}s`,
                              }}
                            ></div>
                          </div>
                          <div className="blb">{m}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {MONTHS.map((m) => (
                        <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,.22)' }}>
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ov-txlist">
                    <div className="ov-txh">
                      <div className="ov-txhtt">Transações recentes</div>
                      <div className="ov-txlink">Ver todas</div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🛒</div>
                      <div className="li-info">
                        <div className="li-name">Mercado Extra</div>
                        <div className="li-sub">Alimentação · hoje</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 187,40</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>💰</div>
                      <div className="li-info">
                        <div className="li-name">Salário</div>
                        <div className="li-sub">Receita · ontem</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val g">+R$ 6.800,00</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(191,90,242,.12)' }}>🎵</div>
                      <div className="li-info">
                        <div className="li-name">Spotify Premium</div>
                        <div className="li-sub">Assinatura · 18/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 26,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>⛽</div>
                      <div className="li-info">
                        <div className="li-name">Shell Posto</div>
                        <div className="li-sub">Transporte · 17/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 220,00</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TRANSAÇÕES */}
                <div className={`vw${tab === 'tx' ? ' on' : ''}`}>
                  <div className="tx-sums">
                    <div className="tx-sc">
                      <div className="tx-slb">Receitas em Março</div>
                      <div className="tx-sv g">+R$ 7.500</div>
                    </div>
                    <div className="tx-sc">
                      <div className="tx-slb">Gastos em Março</div>
                      <div className="tx-sv r">−R$ 3.240</div>
                    </div>
                  </div>
                  <div className="tx-fs">
                    <button className="tf on" type="button">Todos</button>
                    <button className="tf" type="button">Receitas</button>
                    <button className="tf" type="button">Gastos</button>
                    <button className="tf" type="button">Alimentação</button>
                    <button className="tf" type="button">Transporte</button>
                  </div>
                  <div className="tx-body">
                    <div className="tx-date">Hoje — 20/Mar</div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🛒</div>
                      <div className="li-info">
                        <div className="li-name">Mercado Extra</div>
                        <div className="li-sub">Alimentação</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 187,40</div>
                      </div>
                    </div>
                    <div className="tx-date">Ontem — 19/Mar</div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>💰</div>
                      <div className="li-info">
                        <div className="li-name">Salário</div>
                        <div className="li-sub">Receita</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val g">+R$ 6.800,00</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,69,58,.12)' }}>🏠</div>
                      <div className="li-info">
                        <div className="li-name">Aluguel</div>
                        <div className="li-sub">Moradia</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val r">−R$ 1.800,00</div>
                      </div>
                    </div>
                    <div className="tx-date">17/Mar</div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>⛽</div>
                      <div className="li-info">
                        <div className="li-name">Shell Posto</div>
                        <div className="li-sub">Transporte</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 220,00</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(10,132,255,.12)' }}>🍔</div>
                      <div className="li-info">
                        <div className="li-name">iFood</div>
                        <div className="li-sub">Alimentação</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 64,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(191,90,242,.12)' }}>🎵</div>
                      <div className="li-info">
                        <div className="li-name">Spotify</div>
                        <div className="li-sub">Assinatura</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 26,90</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PARCELAS */}
                <div className={`vw${tab === 'inst' ? ' on' : ''}`}>
                  <div className="inst-top">
                    <div className="inst-tl">
                      <div className="i-lb">Total mensal</div>
                      <div className="i-v">R$ 1.240</div>
                    </div>
                    <div className="inst-tr">
                      <div className="i-s">Parcelamentos</div>
                      <div className="i-c">4 ativos</div>
                    </div>
                  </div>
                  <div className="inst-list">
                    <div className="inst-row">
                      <div className="inst-ico" style={{ background: 'rgba(10,132,255,.12)' }}>📱</div>
                      <div className="inst-inf">
                        <div className="inst-n">iPhone 15 Pro</div>
                        <div className="inst-m">8 de 12 parcelas · 4 restantes</div>
                        <div className="ibar">
                          <div className="ifill" style={{ width: '67%', background: 'linear-gradient(90deg,#0a84ff,#93c5fd)' }}></div>
                        </div>
                      </div>
                      <div className="inst-rr">
                        <div className="inst-rv">R$ 499/mês</div>
                        <div className="inst-rs">67%</div>
                      </div>
                    </div>
                    <div className="inst-row">
                      <div className="inst-ico" style={{ background: 'rgba(191,90,242,.12)' }}>💻</div>
                      <div className="inst-inf">
                        <div className="inst-n">MacBook Air M2</div>
                        <div className="inst-m">3 de 10 parcelas · 7 restantes</div>
                        <div className="ibar">
                          <div className="ifill" style={{ width: '30%', background: 'linear-gradient(90deg,#bf5af2,#c4b5fd)' }}></div>
                        </div>
                      </div>
                      <div className="inst-rr">
                        <div className="inst-rv">R$ 650/mês</div>
                        <div className="inst-rs">30%</div>
                      </div>
                    </div>
                    <div className="inst-row">
                      <div className="inst-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🎮</div>
                      <div className="inst-inf">
                        <div className="inst-n">PlayStation 5</div>
                        <div className="inst-m">5 de 6 parcelas · 1 restante</div>
                        <div className="ibar">
                          <div className="ifill" style={{ width: '83%', background: 'linear-gradient(90deg,var(--g),#86efac)' }}></div>
                        </div>
                      </div>
                      <div className="inst-rr">
                        <div className="inst-rv">R$ 91/mês</div>
                        <div className="inst-rs">83%</div>
                      </div>
                    </div>
                    <div className="inst-row">
                      <div className="inst-ico" style={{ background: 'rgba(255,159,10,.12)' }}>🛋️</div>
                      <div className="inst-inf">
                        <div className="inst-n">Sofá 3 lugares</div>
                        <div className="inst-m">1 de 4 parcelas · 3 restantes</div>
                        <div className="ibar">
                          <div className="ifill" style={{ width: '25%', background: 'linear-gradient(90deg,#ffb347,#fde68a)' }}></div>
                        </div>
                      </div>
                      <div className="inst-rr">
                        <div className="inst-rv">R$ 350/mês</div>
                        <div className="inst-rs">25%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ASSINATURAS */}
                <div className={`vw${tab === 'sub' ? ' on' : ''}`}>
                  <div className="sub-top">
                    <div className="sub-tl">Comprometido por mês</div>
                    <div className="sub-tot">R$ 268,70</div>
                    <div className="sub-cats">
                      <span className="scat" style={{ background: 'rgba(191,90,242,.1)', color: '#bf5af2' }}>🎵 Entretenimento</span>
                      <span className="scat" style={{ background: 'rgba(61,220,132,.1)', color: 'var(--g)' }}>💪 Saúde</span>
                      <span className="scat" style={{ background: 'rgba(255,159,10,.1)', color: '#ffb347' }}>☁️ Serviços</span>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🎵</div>
                      <div className="li-info">
                        <div className="li-name">Spotify Premium</div>
                        <div className="li-sub">Todo dia 22 · cartão</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 26,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,69,58,.12)' }}>🎬</div>
                      <div className="li-info">
                        <div className="li-name">Netflix</div>
                        <div className="li-sub">Todo dia 15 · cartão</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 44,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(10,132,255,.12)' }}>📺</div>
                      <div className="li-info">
                        <div className="li-name">Disney+</div>
                        <div className="li-sub">Todo dia 8 · cartão</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 27,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>📦</div>
                      <div className="li-info">
                        <div className="li-name">Amazon Prime</div>
                        <div className="li-sub">Todo dia 18 · cartão</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 19,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>💪</div>
                      <div className="li-info">
                        <div className="li-name">Smart Fit</div>
                        <div className="li-sub">Todo dia 1 · débito</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 99,90</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(90,200,250,.12)' }}>☁️</div>
                      <div className="li-info">
                        <div className="li-name">iCloud 200GB</div>
                        <div className="li-sub">Todo dia 3 · cartão</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 6,90</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARTÕES */}
                <div className={`vw${tab === 'cards' ? ' on' : ''}`}>
                  <div className="cards-wrap">
                    <div className="phcard">
                      <div className="cc-row">
                        <div className="cc-chip"></div>
                        <div className="cc-brand">NUBANK VISA INFINITE</div>
                      </div>
                      <div className="cc-num">•••• •••• •••• 4829</div>
                      <div className="cc-bot">
                        <div>
                          <div className="cc-ll">Limite disponível</div>
                          <div className="cc-lv">R$ 6.800</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="cc-dl">Vencimento</div>
                          <div className="cc-dv">28 Mar</div>
                        </div>
                      </div>
                      <div className="cc-bar">
                        <div className="cc-fill" style={{ width: revealed ? '32%' : 0 }}></div>
                      </div>
                      <div className="cc-usage">
                        <span>Usado: R$ 3.200</span>
                        <span>32% do limite</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Fatura atual
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🛒</div>
                      <div className="li-info">
                        <div className="li-name">Mercado Extra</div>
                        <div className="li-sub">20/Mar · à vista</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 187,40</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>✈️</div>
                      <div className="li-info">
                        <div className="li-name">GOL Passagem</div>
                        <div className="li-sub">15/Mar · 6x</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 183,00</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(10,132,255,.12)' }}>🍽️</div>
                      <div className="li-info">
                        <div className="li-name">Outback</div>
                        <div className="li-sub">12/Mar · à vista</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 289,00</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTAS FIXAS */}
                <div className={`vw${tab === 'bills' ? ' on' : ''}`}>
                  <div className="bills-stats">
                    <div className="bs">
                      <div className="bs-v" style={{ color: 'var(--g)' }}>R$ 1.919</div>
                      <div className="bs-l">Pago</div>
                    </div>
                    <div className="bs" style={{ borderLeft: '1px solid var(--sep)' }}>
                      <div className="bs-v" style={{ color: '#ffb347' }}>R$ 297</div>
                      <div className="bs-l">Pendente</div>
                    </div>
                    <div className="bs" style={{ borderLeft: '1px solid var(--sep)' }}>
                      <div className="bs-v" style={{ color: '#ff6060' }}>R$ 560</div>
                      <div className="bs-l">A vencer</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>✅</div>
                      <div className="li-info">
                        <div className="li-name">Aluguel</div>
                        <div className="li-sub">Pago em 10/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val g">R$ 1.800</div>
                        <div className="li-s2">pago</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>✅</div>
                      <div className="li-info">
                        <div className="li-name">Internet Vivo</div>
                        <div className="li-sub">Pago em 5/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val g">R$ 119</div>
                        <div className="li-s2">pago</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>⚡</div>
                      <div className="li-info">
                        <div className="li-name">Conta de Luz</div>
                        <div className="li-sub">Vence em 28/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val a">R$ 210</div>
                        <div className="li-s2">pendente</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>💧</div>
                      <div className="li-info">
                        <div className="li-name">Conta de Água</div>
                        <div className="li-sub">Vence em 30/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val a">R$ 87</div>
                        <div className="li-s2">pendente</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,69,58,.12)' }}>🏥</div>
                      <div className="li-info">
                        <div className="li-name">Plano de Saúde</div>
                        <div className="li-sub">Vence em 25/Mar</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val r">R$ 560</div>
                        <div className="li-s2">a vencer</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* METAS */}
                <div className={`vw${tab === 'goals' ? ' on' : ''}`}>
                  <div className="goals-list">
                    <div className="gcard">
                      <div className="gcard-top">
                        <div className="gc-left">
                          <div className="gc-ico">✈️</div>
                          <div>
                            <div className="gc-name">Viagem para Europa</div>
                            <div className="gc-target">Meta: R$ 12.500 · até Dez/25</div>
                          </div>
                        </div>
                        <div className="gc-pct" style={{ color: '#0a84ff' }}>64%</div>
                      </div>
                      <div className="gbar">
                        <div className="gf" style={{ width: revealed ? '64%' : 0, background: 'linear-gradient(90deg,#0a84ff,#93c5fd)' }}></div>
                      </div>
                      <div className="gvals">
                        <span>Guardado: <strong style={{ color: '#0a84ff' }}>R$ 8.000</strong></span>
                        <span>Falta: R$ 4.500</span>
                      </div>
                    </div>
                    <div className="gcard">
                      <div className="gcard-top">
                        <div className="gc-left">
                          <div className="gc-ico">🚗</div>
                          <div>
                            <div className="gc-name">Entrada do carro</div>
                            <div className="gc-target">Meta: R$ 20.000 · até Jun/26</div>
                          </div>
                        </div>
                        <div className="gc-pct" style={{ color: '#ffb347' }}>38%</div>
                      </div>
                      <div className="gbar">
                        <div className="gf" style={{ width: revealed ? '38%' : 0, background: 'linear-gradient(90deg,#ffb347,#fde68a)' }}></div>
                      </div>
                      <div className="gvals">
                        <span>Guardado: <strong style={{ color: '#ffb347' }}>R$ 7.600</strong></span>
                        <span>Falta: R$ 12.400</span>
                      </div>
                    </div>
                    <div className="gcard">
                      <div className="gcard-top">
                        <div className="gc-left">
                          <div className="gc-ico">🛡️</div>
                          <div>
                            <div className="gc-name">Reserva de emergência</div>
                            <div className="gc-target">Meta: R$ 20.000</div>
                          </div>
                        </div>
                        <div className="gc-pct" style={{ color: 'var(--g)' }}>91%</div>
                      </div>
                      <div className="gbar">
                        <div className="gf" style={{ width: revealed ? '91%' : 0, background: 'linear-gradient(90deg,var(--g),#86efac)' }}></div>
                      </div>
                      <div className="gvals">
                        <span>Guardado: <strong>R$ 18.200</strong></span>
                        <span>Falta: R$ 1.800</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INVESTIMENTOS */}
                <div className={`vw${tab === 'inv' ? ' on' : ''}`}>
                  <div className="inv-top">
                    <div>
                      <div className="inv-tt-l">Carteira total</div>
                      <div className="inv-tt-v">R$ 29.930</div>
                    </div>
                    <div className="inv-cdi">CDI: 10,65% a.a.</div>
                  </div>
                  <div className="inv-cols">
                    <div className="icol">Investimento</div>
                    <div className="icol">Bruto</div>
                    <div className="icol g">Líquido ✓</div>
                  </div>
                  <div className="irow">
                    <div className="ir-left">
                      <div className="ir-ico">🏦</div>
                      <div>
                        <div className="ir-n1">CDB Nubank</div>
                        <div className="ir-n2">110% CDI · 14m</div>
                      </div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v">R$ 10.420</div>
                      <div className="ir-s">+R$ 420</div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v g">R$ 9.946</div>
                      <div className="ir-s g">IR 22,5%</div>
                    </div>
                  </div>
                  <div className="irow">
                    <div className="ir-left">
                      <div className="ir-ico">🌿</div>
                      <div>
                        <div className="ir-n1">LCI Itaú</div>
                        <div className="ir-n2">95% CDI · isento IR</div>
                      </div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v">R$ 8.810</div>
                      <div className="ir-s">+R$ 810</div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v g">R$ 8.810</div>
                      <div className="ir-s g">isento ✓</div>
                    </div>
                  </div>
                  <div className="irow">
                    <div className="ir-left">
                      <div className="ir-ico">🏛️</div>
                      <div>
                        <div className="ir-n1">Tesouro IPCA+</div>
                        <div className="ir-n2">IPCA + 5,82%</div>
                      </div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v">R$ 5.890</div>
                      <div className="ir-s">+R$ 890</div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v g">R$ 5.614</div>
                      <div className="ir-s g">IR R$ 276</div>
                    </div>
                  </div>
                  <div className="irow">
                    <div className="ir-left">
                      <div className="ir-ico">₿</div>
                      <div>
                        <div className="ir-n1">Bitcoin</div>
                        <div className="ir-n2">Criptomoeda</div>
                      </div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v">R$ 5.620</div>
                      <div className="ir-s">+R$ 620</div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v a">R$ 5.527</div>
                      <div className="ir-s" style={{ color: 'rgba(255,179,71,.5)' }}>IR R$ 93</div>
                    </div>
                  </div>
                  <div className="irow">
                    <div className="ir-left">
                      <div className="ir-ico">🏗️</div>
                      <div>
                        <div className="ir-n1">HGLG11 FII</div>
                        <div className="ir-n2">FII Logística · isento PF</div>
                      </div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v">R$ 4.300</div>
                      <div className="ir-s">+R$ 300</div>
                    </div>
                    <div className="ir-col">
                      <div className="ir-v g">R$ 4.300</div>
                      <div className="ir-s g">isento ✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mock-shine"></div>
          </div>
        </div>
      </section>

      {/* TICKER (still dark bg) */}
      <div style={{ background: 'var(--blk)' }}>
        <div className="ticker-wrap">
          <div className="ticker">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div className="ti" key={i}>
                {item.icon} <span>{item.text}</span>&nbsp;<strong>{item.strong}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ STATS (LIGHT) ══════════ */}
      <div className="stats-row" data-motion="rise">
        <div className="st-cell">
          <div className="st-v">8</div>
          <div className="st-l">módulos completos</div>
        </div>
        <div className="st-cell">
          <div className="st-v">30 dias</div>
          <div className="st-l">grátis, sem cartão</div>
        </div>
        <div className="st-cell">
          <div className="st-v">100%</div>
          <div className="st-l">dos dados isolados por conta</div>
        </div>
        <div className="st-cell">
          <div className="st-v">R$ 14</div>
          <div className="st-l">por mês no Pro</div>
        </div>
      </div>

      {/* ══════════ FEATURES (DARK ROUNDED) ══════════ */}
      <div className="dsec-wrap" id="funcionalidades">
        <div className="dsec">
          <div className="dsec-glow dg1"></div>
          <div className="dsec-glow dg2"></div>
          <div className="dsec-grid"></div>
          <div className="dsec-body">
            <div style={{ textAlign: 'center', marginBottom: 0 }} data-motion="rise">
              <div className="sec-pill dk">
                <span></span>Funcionalidades
              </div>
              <h2 className="h2-dk h2-c">
                Tudo para organizar
                <br />
                <em>sua vida financeira</em>
              </h2>
              <p className="sub-dk sub-c">Sem planilhas. Sem complicação. Um app que realmente funciona no dia a dia.</p>
            </div>
            <div className="feat-grid" data-motion="stagger">
              <div className="fc" style={{ '--motion-i': 0 } as CSSProperties}>
                <div className="fc-ico">💸</div>
                <div className="fc-title">Controle de gastos</div>
                <div className="fc-desc">Lance transações em segundos, categorize automaticamente e veja para onde seu dinheiro vai todo mês.</div>
                <div className="fc-tags">
                  <span className="ft">Categorias</span>
                  <span className="ft">Filtros</span>
                  <span className="ft">Histórico</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
              <div className="fc" style={{ '--motion-i': 1 } as CSSProperties}>
                <div className="fc-ico">💳</div>
                <div className="fc-title">Cartões e faturas</div>
                <div className="fc-desc">Múltiplos cartões com controle de limite em tempo real e aviso antes do vencimento da fatura.</div>
                <div className="fc-tags">
                  <span className="ft">Multi-cartão</span>
                  <span className="ft">Limite real</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
              <div className="fc" style={{ '--motion-i': 2 } as CSSProperties}>
                <div className="fc-ico">🔁</div>
                <div className="fc-title">Assinaturas</div>
                <div className="fc-desc">Netflix, Spotify, academia. Veja o total comprometido por mês e receba lembretes antes do vencimento.</div>
                <div className="fc-tags">
                  <span className="ft">Lembretes</span>
                  <span className="ft">Previsão</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
              <div className="fc" style={{ '--motion-i': 3 } as CSSProperties}>
                <div className="fc-ico">🏦</div>
                <div className="fc-title">Contas bancárias</div>
                <div className="fc-desc">Múltiplas contas com saldo calculado em tempo real baseado nas suas transações reais. Sempre preciso.</div>
                <div className="fc-tags">
                  <span className="ft">Saldo consolidado</span>
                  <span className="ft">Multi-banco</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
              <div className="fc" style={{ '--motion-i': 4 } as CSSProperties}>
                <div className="fc-ico">📈</div>
                <div className="fc-title">Investimentos</div>
                <div className="fc-desc">CDB, LCI, LCA, Tesouro, ações B3, FIIs e cripto. CDI real via Banco Central. IR regressivo automático.</div>
                <div className="fc-tags">
                  <span className="ft">CDI real</span>
                  <span className="ft">IR auto</span>
                  <span className="ft">8 tipos</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
              <div className="fc" style={{ '--motion-i': 5 } as CSSProperties}>
                <div className="fc-ico">🎯</div>
                <div className="fc-title">Metas financeiras</div>
                <div className="fc-desc">Viagem, emergência, carro. Crie metas com prazo e valor alvo. Acompanhe o progresso mês a mês.</div>
                <div className="fc-tags">
                  <span className="ft">Progresso visual</span>
                  <span className="ft">Prazo</span>
                </div>
                <a href="/criar-conta" onClick={goRegister} className="learn-more">
                  Saiba mais <div className="learn-more-icon">→</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ INVESTIMENTOS (LIGHT) ══════════ */}
      <div className="lsec" id="investimentos">
        <div className="lsec-inner">
          <div className="split" data-motion="split">
            <div>
              <div className="sec-pill lt">
                <span></span>Módulo Pro
              </div>
              <h2 className="h2-lt">
                Rendimento bruto
                <br />
                <em>e líquido, separados</em>
              </h2>
              <p className="sub-lt">
                CDI atualizado diariamente pela API do Banco Central. Você vê exatamente quanto vai receber após o
                IR regressivo — de 22,5% a 15% conforme o prazo.
              </p>
              <ul className="cklist">
                <li className="ck-row lt">
                  <div className="ck-ico"></div>CDB, LCI/LCA — percentual do CDI configurável
                </li>
                <li className="ck-row lt">
                  <div className="ck-ico"></div>Tesouro Direto: Selic e IPCA+ com spread
                </li>
                <li className="ck-row lt">
                  <div className="ck-ico"></div>Ações brasileiras (B3) e FIIs com dividend yield
                </li>
                <li className="ck-row lt">
                  <div className="ck-ico"></div>Criptomoedas e poupança (isenta de IR)
                </li>
                <li className="ck-row lt">
                  <div className="ck-ico"></div>Cotações: Ibovespa, S&amp;P500, Dólar, Bitcoin, Euro
                </li>
                <li className="ck-row lt">
                  <div className="ck-ico"></div>Resgate parcial ou total com registro automático
                </li>
              </ul>
            </div>
            <div>
              <div className="ui-card">
                <div className="ui-card-h">
                  <div className="ui-card-ht">📈 Carteira · R$ 29.930</div>
                  <div className="ui-badge-g">CDI: 10,65% a.a.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 82px 82px', padding: '7px 16px 4px', borderBottom: '1px solid var(--sep2)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(0,0,0,.3)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Investimento</div>
                  <div style={{ fontSize: 9, color: 'rgba(0,0,0,.3)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Bruto</div>
                  <div style={{ fontSize: 9, color: '#1a8847', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Líquido ✓</div>
                </div>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sep2)', display: 'grid', gridTemplateColumns: '1fr 82px 82px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 16 }}>🏦</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>CDB Nubank</div>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>110% CDI · 14m</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>R$ 10.420</div>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>+R$ 420</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a8847' }}>R$ 9.946</div>
                    <div style={{ fontSize: 10, color: 'rgba(61,220,132,.6)' }}>IR 22,5%</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 82px 82px', padding: '10px 16px', borderBottom: '1px solid var(--sep2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 16 }}>🌿</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>LCI Itaú</div>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>95% CDI · isento IR</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>R$ 8.810</div>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>+R$ 810</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a8847' }}>R$ 8.810</div>
                    <div style={{ fontSize: 10, color: 'rgba(61,220,132,.6)' }}>isento ✓</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 82px 82px', padding: '10px 16px', borderBottom: '1px solid var(--sep2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 16 }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Tesouro IPCA+</div>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>IPCA + 5,82%</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>R$ 5.890</div>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>+R$ 890</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a8847' }}>R$ 5.614</div>
                    <div style={{ fontSize: 10, color: 'rgba(61,220,132,.6)' }}>IR R$ 276</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 82px 82px', padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 16 }}>₿</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>Bitcoin</div>
                      <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>Criptomoeda</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>R$ 5.620</div>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,.35)' }}>+R$ 620</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>R$ 5.527</div>
                    <div style={{ fontSize: 10, color: 'rgba(180,83,9,.5)' }}>IR R$ 93</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ CARTÕES (DARK ROUNDED) ══════════ */}
      <div className="dsec-wrap">
        <div className="dsec">
          <div className="dsec-glow dg1" style={{ left: 'auto', right: -60, top: -80 }}></div>
          <div className="dsec-glow dg2" style={{ bottom: -60, top: 'auto', left: -40 }}></div>
          <div className="dsec-grid"></div>
          <div className="dsec-body">
            <div className="split split-flip">
              <div>
                <div className="sec-pill dk">
                  <span></span>Gestão de cartões
                </div>
                <h2 className="h2-dk">
                  Fatura e limite
                  <br />
                  <em>sempre claros</em>
                </h2>
                <p className="sub-dk">
                  Acompanhe o limite disponível em tempo real. Saiba o que vence e quando — antes de ser surpreendido
                  no fechamento.
                </p>
                <ul className="cklist">
                  <li className="ck-row">
                    <div className="ck-ico"></div>Limite total e disponível atualizado a cada gasto
                  </li>
                  <li className="ck-row">
                    <div className="ck-ico"></div>Faturas com data de vencimento e total acumulado
                  </li>
                  <li className="ck-row">
                    <div className="ck-ico"></div>Parcelas vinculadas ao cartão automaticamente
                  </li>
                  <li className="ck-row">
                    <div className="ck-ico"></div>Múltiplos cartões com cores personalizadas
                  </li>
                  <li className="ck-row">
                    <div className="ck-ico"></div>Barra visual de limite usado e disponível
                  </li>
                </ul>
              </div>
              <div>
                <div style={{ background: 'var(--d2)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
                  <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--sep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.02)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wh)', display: 'flex', alignItems: 'center', gap: 8 }}>💳 Meus cartões</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.28)' }}>1 ativo</div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ borderRadius: 14, padding: 18, background: 'linear-gradient(135deg,#1c1028,#22183a)', border: '1px solid rgba(255,255,255,.1)', position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'radial-gradient(circle,rgba(61,220,132,.1),transparent 70%)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ width: 28, height: 20, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 4 }}></div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(255,255,255,.28)' }}>NUBANK VISA INFINITE</div>
                      </div>
                      <div style={{ fontSize: 12, letterSpacing: 3, color: 'rgba(255,255,255,.28)', marginBottom: 14, fontWeight: 300 }}>•••• •••• •••• 4829</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.3, color: 'rgba(255,255,255,.28)', marginBottom: 2 }}>Limite disponível</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>R$ 6.800</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.28)', marginBottom: 2 }}>Vencimento</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#ffb347' }}>28 Mar</div>
                        </div>
                      </div>
                      <div style={{ height: 2.5, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden', marginTop: 14 }}>
                        <div style={{ height: '100%', width: 0, background: 'linear-gradient(90deg,var(--g),#86efac)', borderRadius: 2, transition: 'width 1.5s ease' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,.22)' }}>
                        <span>Usado: R$ 3.200</span>
                        <span>32% do limite</span>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(61,220,132,.12)' }}>🛒</div>
                      <div className="li-info">
                        <div className="li-name">Mercado Extra</div>
                        <div className="li-sub">20/Mar · à vista</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 187,40</div>
                      </div>
                    </div>
                    <div className="li">
                      <div className="li-ico" style={{ background: 'rgba(255,159,10,.12)' }}>✈️</div>
                      <div className="li-info">
                        <div className="li-name">GOL Passagem</div>
                        <div className="li-sub">15/Mar · 6x</div>
                      </div>
                      <div className="li-right">
                        <div className="li-val n">−R$ 183,00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ PRICING (LIGHT) ══════════ */}
      <div className="lsec alt" id="precos">
        <div className="lsec-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="sec-pill lt">
              <span></span>Preços
            </div>
            <h2 className="h2-lt h2-c">
              Simples e <em>transparente</em>
            </h2>
            <p className="sub-lt sub-c">Comece grátis. Upgrade quando fizer sentido para você.</p>
          </div>
          <div className="pgrid">
            <div className="pcard">
              <div className="pplan">Free</div>
              <div className="pprice">
                R$<sub>/mês</sub>0
              </div>
              <div className="pnote">Para quem está começando</div>
              <ul className="pfeats">
                <li>
                  <div className="pk">✓</div>50 transações por mês
                </li>
                <li>
                  <div className="pk">✓</div>1 cartão de crédito
                </li>
                <li>
                  <div className="pk">✓</div>2 contas bancárias
                </li>
                <li>
                  <div className="pk">✓</div>Parcelas e assinaturas
                </li>
                <li>
                  <div className="pk">✓</div>Contas fixas
                </li>
                <li className="off">
                  <div className="px">✕</div>Investimentos
                </li>
                <li className="off">
                  <div className="px">✕</div>Metas financeiras
                </li>
              </ul>
              <a href="/criar-conta" onClick={goRegister} className="pbtn">
                Criar conta grátis
              </a>
            </div>
            <div className="pcard pro">
              <div className="pbadge">✦ POPULAR</div>
              <div className="pplan g">Pro</div>
              <div className="pprice">
                <sup>R$</sup>14<sub>,90/mês</sub>
              </div>
              <div className="pnote">Ou R$ 160,92/ano — 2 meses grátis</div>
              <ul className="pfeats">
                <li>
                  <div className="pk">✓</div>Transações ilimitadas
                </li>
                <li>
                  <div className="pk">✓</div>Cartões ilimitados
                </li>
                <li>
                  <div className="pk">✓</div>Contas ilimitadas
                </li>
                <li>
                  <div className="pk">✓</div>Parcelas e assinaturas
                </li>
                <li>
                  <div className="pk">✓</div>Contas fixas
                </li>
                <li>
                  <div className="pk">✓</div>Investimentos completos
                </li>
                <li>
                  <div className="pk">✓</div>Metas financeiras
                </li>
              </ul>
              <a href="/criar-conta" onClick={goRegister} className="pbtn s">
                Começar trial de 30 dias
              </a>
            </div>
          </div>
          <div className="trial-band">
            <h4>🎁 30 dias com tudo liberado, sem cartão</h4>
            <p>Todo novo cadastro ganha acesso completo ao Pro por 30 dias. Sem compromisso nenhum.</p>
          </div>
        </div>
      </div>

      {/* ══════════ DEPOIMENTOS ══════════
          Renderiza só quando existe relato REAL cadastrado. Com a lista vazia a
          seção nem entra no DOM — sem bloco vazio e sem placeholder no ar.
          A regra do que pode entrar está em testimonials.data.ts. */}
      {TESTIMONIALS.length > 0 && (
        <div className="lsec" id="depoimentos">
          <div className="lsec-inner">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="sec-pill lt">
                <span></span>Depoimentos
              </div>
              <h2 className="h2-lt h2-c">
                Quem usa o <em>Flux</em> no dia a dia
              </h2>
              <p className="sub-lt sub-c">
                Relatos de pessoas que organizaram as próprias finanças com o app.
              </p>
            </div>
            <div className="tgrid">
              {TESTIMONIALS.map((t) => (
                <figure className="tcard" key={t.source}>
                  <div className="thead">
                    <div className={`tav tone${avatarTone(t.name)}`} aria-hidden="true">
                      {initials(t.name)}
                    </div>
                    <figcaption className="tid">
                      <div className="tname">{t.name}</div>
                      {t.handle && <div className="thandle">@{t.handle}</div>}
                    </figcaption>
                  </div>
                  <blockquote className="tquote">{t.quote}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ FAQ (DARK ROUNDED) ══════════ */}
      <div className="dsec-wrap" id="faq">
        <div className="dsec">
          <div className="dsec-glow dg1"></div>
          <div className="dsec-grid"></div>
          <div className="dsec-body">
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="sec-pill dk">
                <span></span>Dúvidas
              </div>
              <h2 className="h2-dk h2-c">
                Perguntas <em>frequentes</em>
              </h2>
            </div>
            <div className="flist">
              {FAQ_ITEMS.map((item, i) => (
                <div className={`faq${openFaq === i ? ' open' : ''}`} key={item.q}>
                  <button
                    className="fq"
                    type="button"
                    onClick={() => setOpenFaq((cur) => (cur === i ? null : i))}
                  >
                    {item.q}
                    <div className="fqx">+</div>
                  </button>
                  <div className="fa">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ FINAL CTA ══════════ */}
      <div className="fcta-wrap">
        <div className="fcta-box">
          <div className="fcta-g1"></div>
          <div className="fcta-grid"></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="pill" style={{ justifyContent: 'center', display: 'inline-flex' }}>
              <div className="pill-dot"></div>Comece hoje mesmo
            </div>
          </div>
          <h2>
            Comece hoje,
            <br />
            veja a diferença <em>amanhã</em>
          </h2>
          <p>30 dias grátis. Sem cartão. Sem complicação.</p>
          <a href="/criar-conta" onClick={goRegister} className="cta-wh" style={{ fontSize: 16, padding: '16px 36px' }}>
            Abrir conta Flux
            <ArrowRightIcon size={16} />
          </a>
          <div className="hero-notes" style={{ justifyContent: 'center', marginTop: 16 }}>
            <span>Sem cartão</span>
            <span>Cancele quando quiser</span>
            <span>Dados seguros</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="flogo">
          <div className="nlogo-mark" style={{ background: 'var(--g08)', border: '1px solid rgba(61,220,132,.2)' }}>
            F
          </div>
          Flux
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <p>Controle financeiro pessoal · Feito com ❤️ no Brasil</p>
          <Link to="/privacidade" style={{ fontSize: 12, color: 'rgba(0,0,0,.3)' }}>
            Privacidade
          </Link>
          <Link to="/termos" style={{ fontSize: 12, color: 'rgba(0,0,0,.3)' }}>
            Termos
          </Link>
        </div>
      </footer>
    </div>
  )
}
