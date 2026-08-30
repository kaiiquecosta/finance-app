import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './LandingPage.modern.css'

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

function ProductPreview() {
  const [preview, setPreview] = useState<'overview' | 'investor' | 'community'>('overview')
  return (
    <div className="lp-product">
      <div className="lp-window">
        <div className="lp-windowbar">
          <div className="lp-dots"><i /><i /><i /></div>
          <span>finance-app-one-weld.vercel.app</span>
          <b>•••</b>
        </div>
        <div className="lp-appbar">
          <div className="lp-mini-brand"><i>F</i><span>Flux</span></div>
          <div className="lp-preview-tabs">
            <button className={preview === 'overview' ? 'active' : ''} onClick={() => setPreview('overview')}>Visão geral</button>
            <button className={preview === 'investor' ? 'active' : ''} onClick={() => setPreview('investor')}>Investidor</button>
            <button className={preview === 'community' ? 'active' : ''} onClick={() => setPreview('community')}>Comunidade</button>
          </div>
          <span className="lp-avatar">KC</span>
        </div>

        {preview === 'overview' && (
          <div className="lp-screen lp-overview">
            <div className="lp-balance">
              <span>Patrimônio total</span>
              <strong>R$ 48.420,80</strong>
              <small>↗ 12,4% este mês</small>
            </div>
            <div className="lp-kpis">
              <div><span>Receitas</span><b className="green">R$ 8.500</b></div>
              <div><span>Gastos</span><b>R$ 4.212</b></div>
              <div><span>Investido</span><b>R$ 1.800</b></div>
            </div>
            <div className="lp-panel lp-chart-panel">
              <div className="lp-panel-title"><b>Fluxo do mês</b><span>Últimos 6 meses</span></div>
              <div className="lp-chart">
                {[42, 58, 49, 67, 61, 83, 72, 94, 79, 100, 86, 108].map((h, i) => (
                  <i key={i} style={{ height: `${h / 1.25}%` }} className={i > 8 ? 'hot' : ''} />
                ))}
              </div>
              <div className="lp-months"><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span></div>
            </div>
            <div className="lp-side-panel lp-panel">
              <div className="lp-panel-title"><b>Gastos por categoria</b><span>Agosto</span></div>
              <div className="lp-donut"><div><b>R$ 4,2 mil</b><span>total</span></div></div>
              <div className="lp-legend"><span><i className="cyan" />Casa</span><span><i className="orange" />Compras</span><span><i className="blue" />Transporte</span></div>
            </div>
          </div>
        )}

        {preview === 'investor' && (
          <div className="lp-screen lp-investor">
            <div className="lp-invest-head">
              <div><span>Investidor</span><strong>O mercado, sem ruído.</strong></div>
              <button>＋ Investir</button>
            </div>
            <div className="lp-market-strip">
              <div><span>IBOV</span><b>137.912</b><small>+1,28%</small></div>
              <div><span>DÓLAR</span><b>R$ 5,42</b><small className="red">−0,32%</small></div>
              <div><span>BITCOIN</span><b>US$ 118 mil</b><small>+2,71%</small></div>
            </div>
            <div className="lp-stock-card lp-panel">
              <div className="lp-stock-title"><i>B³</i><div><b>B3 ON</b><span>B3SA3 · B3</span></div><strong>R$ 16,05</strong></div>
              <svg viewBox="0 0 500 100" preserveAspectRatio="none" aria-hidden>
                <defs><linearGradient id="linefill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#30d158" stopOpacity=".28"/><stop offset="1" stopColor="#30d158" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,82 C35,76 58,86 90,66 S145,58 178,62 S230,44 260,49 S315,20 350,35 S402,15 438,24 S470,9 500,12 L500,100 L0,100Z" fill="url(#linefill)"/>
                <path d="M0,82 C35,76 58,86 90,66 S145,58 178,62 S230,44 260,49 S315,20 350,35 S402,15 438,24 S470,9 500,12" fill="none" stroke="#30d158" strokeWidth="3"/>
              </svg>
              <div className="lp-fundamentals"><div><span>P/L</span><b>15,12</b></div><div><span>P/VP</span><b>4,31</b></div><div><span>DY</span><b>4,80%</b></div></div>
            </div>
          </div>
        )}

        {preview === 'community' && (
          <div className="lp-screen lp-community">
            <div className="lp-community-head"><span>Comunidade Flux</span><strong>Finanças ficam mais leves quando ideias circulam.</strong></div>
            <div className="lp-community-grid">
              <div className="lp-feed">
                <article><header><i>AM</i><div><b>Ana Martins</b><span>Nova sugestão · Backlog</span></div></header><p>Adicionar comparação mensal por categoria na Visão geral.</p><footer>♡ 24 votos &nbsp;&nbsp; ◯ 8 comentários</footer></article>
                <article><header><i>RL</i><div><b>Rafael Lima</b><span>Em desenvolvimento</span></div></header><p>Notificações personalizadas para contas próximas do vencimento.</p><footer>♡ 63 votos &nbsp;&nbsp; ◯ 14 comentários</footer></article>
              </div>
              <aside><span>Roadmap aberto</span><b>Você ajuda a construir</b><p>Acompanhe ideias do Backlog até chegarem ao app.</p><button>Ver roadmap →</button></aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const go = (path: string) => (event: MouseEvent) => {
    event.preventDefault()
    navigate(path)
  }

  useEffect(() => {
    if (!menu) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [menu])

  return (
    <main className="lp">
      <nav className="lp-nav">
        <a className="lp-brand" href="#" aria-label="Flux"><i>F</i><b>Flux</b></a>
        <div className={`lp-links ${menu ? 'open' : ''}`}>
          <a href="#produto" onClick={() => setMenu(false)}>Produto</a>
          <a href="#investimentos" onClick={() => setMenu(false)}>Investimentos</a>
          <a href="#comunidade" onClick={() => setMenu(false)}>Comunidade</a>
          <a href="#precos" onClick={() => setMenu(false)}>Preços</a>
          <a className="lp-mobile-login" href="/entrar" onClick={go('/entrar')}>Entrar</a>
        </div>
        <div className="lp-nav-actions">
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
          <p>Acompanhe sua carteira e descubra oportunidades com cotações ao vivo, gráficos históricos e indicadores como P/L, P/VP e DY.</p>
          <ul><li>Ações B3 e EUA, FIIs, ETFs e cripto</li><li>Favoritos sincronizados entre dispositivos</li><li>Renda fixa com CDI e IPCA atualizados</li><li>Preço de compra, quantidade e evolução da posição</li></ul>
          <a href="/criar-conta" onClick={go('/criar-conta')}>Explorar o Investidor <Arrow /></a>
        </div>
        <div className="lp-market-visual">
          <div className="lp-market-top"><span>Favoritos</span><small>Mercado aberto · ao vivo</small></div>
          {[['B³','B3SA3','B3 ON','R$ 16,05','+2,31%'],['◆','BBSE3','BB Seguridade','R$ 36,84','+1,18%'],['V','V','Visa','US$ 352,90','+0,84%'],['◉','BTC','Bitcoin','US$ 118.420','+2,71%']].map((row) => (
            <div className="lp-market-row" key={row[1]}><i>{row[0]}</i><div><b>{row[1]}</b><span>{row[2]}</span></div><strong>{row[3]}</strong><small>{row[4]}</small></div>
          ))}
        </div>
      </section>

      <section className="lp-showcase lp-community-section" id="comunidade">
        <div className="lp-community-visual">
          <div className="lp-bubble one">“Finalmente entendi para onde meu dinheiro estava indo.”<b>— Amanda</b></div>
          <div className="lp-bubble two">🎯 Meta concluída: reserva de emergência</div>
          <div className="lp-bubble three">💡 Como vocês organizam os gastos fixos?</div>
          <div className="lp-orbit">F</div>
        </div>
        <div className="lp-showcase-copy light">
          <span className="lp-kicker">Comunidade</span>
          <h2>Aprenda. Compartilhe.<br/><em>Evolua junto.</em></h2>
          <p>Um roadmap aberto para sugerir melhorias, votar nas próximas novidades, comentar ideias e acompanhar o que está sendo construído.</p>
          <a href="/criar-conta" onClick={go('/criar-conta')}>Entrar na comunidade <Arrow /></a>
        </div>
      </section>

      <section className="lp-assistant">
        <div className="lp-assistant-card">
          <div className="lp-wave">{[18,34,52,28,66,45,24,58,38,20].map((h,i)=><i key={i} style={{height:h}} />)}</div>
          <span>Assistente Flux</span>
          <h2>“Gastei 42 reais no mercado.”</h2>
          <p>Pronto. Registrado em Mercado.</p>
          <div className="lp-message">Mercado <b>− R$ 42,00</b></div>
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
