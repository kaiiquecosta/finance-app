import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductPreview } from './landing/ProductPreview'
import { AssistantDemo } from './landing/AssistantDemo'
import { CommunityDemo } from './landing/CommunityDemo'
import { InvestmentShowcaseVisual } from './landing/InvestmentShowcaseVisual'
import './LandingPage.modern.css'

type LandingTheme = 'light' | 'dark'

const THEME_KEY = 'flux-landing-theme'

function readStoredTheme(): LandingTheme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const features = [
  { icon: '◫', title: 'Visão completa', text: 'Saldos, rendas, gastos e compromissos reunidos em um painel que explica o seu mês.' },
  { icon: '↗', title: 'Investidor', text: 'Ações, FIIs, ETFs, renda fixa e cripto com cotações, gráficos e fundamentos.' },
  { icon: '◉', title: 'Cartões', text: 'Limites, faturas, parcelas e importação OFX sem perder nenhum lançamento.' },
  { icon: '◎', title: 'Metas', text: 'Objetivos com prazo, progresso visual e clareza sobre quanto ainda falta.' },
  { icon: '⌁', title: 'Assistente', text: 'Registre gastos e receitas com frases naturais, por texto ou voz.' },
  { icon: '◇', title: 'Comunidade', text: 'Compartilhe ideias, vote em sugestões e acompanhe novidades com outros usuários.' },
]

const faq = [
  ['Preciso de cartão para começar?', 'Não. Você pode criar sua conta e experimentar o Flux por 30 dias sem informar cartão de crédito.'],
  ['Meus dados ficam seguros?', 'Seus dados ficam isolados por conta no Supabase com Row Level Security. Só você acessa o seu histórico financeiro.'],
  ['Funciona no celular?', 'Sim. O Flux é responsivo e pode ser instalado como PWA no celular, além de funcionar no computador e tablet.'],
  ['Quais investimentos posso acompanhar?', 'Ações brasileiras e americanas, FIIs, ETFs, criptomoedas, CDB, LCI/LCA, Tesouro, poupança e outros ativos.'],
]

function Arrow() {
  return <span aria-hidden>↗</span>
}

export function LandingPage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [theme, setTheme] = useState<LandingTheme>(() => readStoredTheme())
  const go = (path: string) => (event: MouseEvent) => {
    event.preventDefault()
    navigate(path)
  }

  useEffect(() => {
    if (!menu) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [menu])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <main className="lp" data-theme={theme}>
      <nav className="lp-nav">
        <a className="lp-brand" href="#" aria-label="Flux"><i>F</i><b>Flux</b></a>
        <div className={`lp-links ${menu ? 'open' : ''}`}>
          <a href="#produto" onClick={() => setMenu(false)}>Produto</a>
          <a href="#assistente" onClick={() => setMenu(false)}>Assistente</a>
          <a href="#investimentos" onClick={() => setMenu(false)}>Investimentos</a>
          <a href="#comunidade" onClick={() => setMenu(false)}>Comunidade</a>
          <a href="#precos" onClick={() => setMenu(false)}>Preços</a>
          <a className="lp-mobile-login" href="/entrar" onClick={go('/entrar')}>Entrar</a>
        </div>
        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-theme-toggle"
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            onClick={toggleTheme}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <a href="/entrar" onClick={go('/entrar')}>Entrar</a>
          <a className="lp-primary small" href="/criar-conta" onClick={go('/criar-conta')}>Começar grátis</a>
          <button className="lp-menu" aria-label="Abrir menu" onClick={() => setMenu(!menu)}><i /><i /></button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-aurora" />
        <div className="lp-eyebrow"><i /> Seu dinheiro. Uma visão.</div>
        <h1>Clareza para hoje.<br/><em>Liberdade para amanhã.</em></h1>
        <p>Uma experiência financeira completa para organizar, entender e fazer seu dinheiro evoluir.</p>
        <div className="lp-hero-actions">
          <a className="lp-primary" href="/criar-conta" onClick={go('/criar-conta')}>Começar grátis <Arrow /></a>
          <a className="lp-secondary" href="#produto">Conhecer o Flux <span>↓</span></a>
        </div>
        <div className="lp-trust"><span>30 dias grátis</span><span>Sem cartão</span><span>Dados protegidos</span></div>
        <ProductPreview />
      </section>

      <AssistantDemo />

      <section className="lp-intro" id="produto">
        <span className="lp-kicker">Tudo conectado</span>
        <h2>Uma imagem clara da sua vida financeira.</h2>
        <p>O Flux transforma contas, cartões, metas e investimentos em decisões simples — sem planilhas, sem ruído.</p>
        <div className="lp-bento">
          {features.map((feature, i) => (
            <article key={feature.title} className={i === 0 || i === 5 ? 'wide' : ''}>
              <i>{feature.icon}</i><h3>{feature.title}</h3><p>{feature.text}</p>
              <span>Saiba mais <Arrow /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-showcase lp-showcase-dark" id="investimentos">
        <div className="lp-showcase-copy">
          <span className="lp-kicker dark">Investimentos</span>
          <h2>Do CDI à bolsa.<br/><em>Tudo no lugar.</em></h2>
          <p>Cotações em tempo real (~10s no pregão), maiores altas e baixas, FIIs, ETFs, cripto e renda fixa — igual ao Investidor do app.</p>
          <ul><li>Sidebar por categoria · B3, EUA, cripto</li><li>Maiores altas e baixas ao vivo</li><li>Favoritos e carteira sincronizados</li><li>CDI e IPCA atualizados</li></ul>
          <a href="/criar-conta" onClick={go('/criar-conta')}>Explorar o Investidor <Arrow /></a>
        </div>
        <div className="lp-showcase-mock lp-showcase-inv">
          <InvestmentShowcaseVisual />
        </div>
      </section>

      <section className="lp-showcase lp-community-section" id="comunidade">
        <CommunityDemo />
        <div className="lp-showcase-copy light">
          <span className="lp-kicker">Comunidade</span>
          <h2>Peça. Vote.<br/><em>Veja sair do forno.</em></h2>
          <p>Um roadmap aberto em colunas — sugira ideias, vote com ♡ e acompanhe do Backlog até chegar em Pronto no app.</p>
          <a href="/criar-conta" onClick={go('/criar-conta')}>Entrar na comunidade <Arrow /></a>
        </div>
      </section>

      <section className="lp-pricing" id="precos">
        <span className="lp-kicker">Simples e transparente</span>
        <h2>Comece no seu ritmo.</h2>
        <p>Experimente todos os recursos por 30 dias. Sem cartão, sem compromisso.</p>
        <div className="lp-price-card">
          <div><span>Flux Pro</span><h3><sup>R$</sup>14<small>,90 / mês</small></h3><p>Para transformar organização em hábito.</p></div>
          <ul><li>✓ Contas e transações ilimitadas</li><li>✓ Cartões, faturas e OFX</li><li>✓ Investimentos completos</li><li>✓ Metas, assistente e comunidade</li></ul>
          <a className="lp-primary" href="/criar-conta" onClick={go('/criar-conta')}>Testar grátis <Arrow /></a>
        </div>
      </section>

      <section className="lp-faq">
        <span className="lp-kicker">Perguntas frequentes</span>
        <h2>Antes de começar.</h2>
        <div>
          {faq.map(([q,a], i) => <article key={q} className={openFaq === i ? 'open' : ''}><button onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{q}</span><i>＋</i></button><p>{a}</p></article>)}
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-aurora" />
        <span>Seu próximo capítulo financeiro.</span>
        <h2>Mais clareza.<br/>Menos preocupação.</h2>
        <a className="lp-primary light" href="/criar-conta" onClick={go('/criar-conta')}>Criar minha conta <Arrow /></a>
        <small>Grátis por 30 dias. Sem cartão.</small>
      </section>

      <footer className="lp-footer">
        <div className="lp-brand"><i>F</i><b>Flux</b></div>
        <p>Finanças pessoais com clareza.</p>
        <div><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos</Link><a href="/entrar" onClick={go('/entrar')}>Entrar</a></div>
        <small>© 2026 Flux. Feito no Brasil.</small>
      </footer>
    </main>
  )
}
