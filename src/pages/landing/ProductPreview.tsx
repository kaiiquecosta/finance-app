import { useState } from 'react'
import { NAV_ITEMS } from '@/app/navItems'
import './productPreview.css'

type PreviewId =
  | 'overview'
  | 'transactions'
  | 'cards'
  | 'installments'
  | 'subscriptions'
  | 'bills'
  | 'goals'
  | 'investments'
  | 'community'

const PREVIEW_TABS: Array<{ id: PreviewId; label: string; icon: string }> = [
  { id: 'overview', label: 'Visão geral', icon: NAV_ITEMS[0].icon },
  { id: 'transactions', label: 'Transações', icon: NAV_ITEMS[1].icon },
  { id: 'cards', label: 'Cartões', icon: NAV_ITEMS[2].icon },
  { id: 'installments', label: 'Parcelas', icon: NAV_ITEMS[3].icon },
  { id: 'subscriptions', label: 'Assinaturas', icon: NAV_ITEMS[4].icon },
  { id: 'bills', label: 'Contas', icon: NAV_ITEMS[5].icon },
  { id: 'goals', label: 'Metas', icon: NAV_ITEMS[6].icon },
  { id: 'investments', label: 'Investimentos', icon: NAV_ITEMS[7].icon },
  { id: 'community', label: 'Comunidade', icon: NAV_ITEMS[8].icon },
]

function ScrollHintBar({ label, variant = 'tabs' }: { label: string; variant?: 'tabs' | 'inner' }) {
  return (
    <div className={`lp-scroll-hint lp-scroll-hint--${variant}`}>
      <span className="lp-scroll-hint-track">
        <i />
      </span>
      <small>{label}</small>
    </div>
  )
}

function MockRow({
  icon,
  iconBg,
  iconBorder,
  name,
  meta,
  value,
  valueClass = '',
}: {
  icon: string
  iconBg?: string
  iconBorder?: string
  name: string
  meta: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="lp-mock-row">
      <span
        className="lp-mock-ico"
        style={{
          background: iconBg ?? 'var(--mock-card2)',
          borderColor: iconBorder ?? 'var(--mock-border)',
        }}
      >
        {icon}
      </span>
      <div>
        <b>{name}</b>
        <small>{meta}</small>
      </div>
      <strong className={valueClass}>{value}</strong>
    </div>
  )
}

export function ProductPreview() {
  const [preview, setPreview] = useState<PreviewId>('overview')

  return (
    <div className="lp-product">
      <div className="lp-window">
        <div className="lp-windowbar">
          <div className="lp-dots">
            <i />
            <i />
            <i />
          </div>
          <span>finance-app-one-weld.vercel.app</span>
          <b>•••</b>
        </div>
        <div className="lp-appbar">
          <div className="lp-mini-brand">
            <i>F</i>
            <span>Flux</span>
          </div>
          <div className="lp-preview-tabs-wrap">
            <div className="lp-preview-tabs">
              {PREVIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={preview === tab.id ? 'active' : ''}
                  onClick={() => setPreview(tab.id)}
                >
                  <span className="lp-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <span className="lp-avatar">KC</span>
        </div>
        <ScrollHintBar label="← Arraste para ver todas as telas do Flux →" />

        {preview === 'overview' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Visão geral</b>
              <small>domingo, 30 de agosto de 2026</small>
            </div>
            <div className="lp-mock-grid3">
              <div className="lp-mock-stat">
                <span>Receitas</span>
                <b className="green">R$ 8.500</b>
              </div>
              <div className="lp-mock-stat">
                <span>Gastos</span>
                <b className="red">R$ 4.212</b>
              </div>
              <div className="lp-mock-stat">
                <span>Saldo</span>
                <b className="green">+ R$ 4.288</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">📊 Gastos por categoria</div>
              <div className="lp-mock-row">
                <span className="lp-mock-ico" style={{ background: '#0891b222', borderColor: '#0891b244' }}>
                  🏠
                </span>
                <div>
                  <b>Contas de casa</b>
                  <small>38% do mês</small>
                </div>
                <strong>− R$ 1.600</strong>
              </div>
              <div className="lp-mock-row">
                <span className="lp-mock-ico" style={{ background: '#f59e0b22', borderColor: '#f59e0b44' }}>
                  🛒
                </span>
                <div>
                  <b>Alimentação</b>
                  <small>24% do mês</small>
                </div>
                <strong>− R$ 1.010</strong>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">Transações recentes</div>
              <MockRow icon="🛒" name="Mercado Extra" meta="Alimentação · hoje" value="− R$ 187,40" />
              <MockRow icon="💰" name="Salário" meta="Receita · ontem" value="+ R$ 6.800" valueClass="green" />
            </div>
          </div>
        )}

        {preview === 'transactions' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Transações</b>
              <small>18 registros · débitos são editáveis (14)</small>
            </div>
            <div className="lp-mock-month">
              <i>‹</i>
              <span>Agosto de 2026</span>
              <i>›</i>
            </div>
            <div className="lp-mock-grid3">
              <div className="lp-mock-stat">
                <span>Receitas</span>
                <b className="green">R$ 8.500</b>
              </div>
              <div className="lp-mock-stat">
                <span>Gastos</span>
                <b className="red">R$ 4.212</b>
              </div>
              <div className="lp-mock-stat">
                <span>Saldo</span>
                <b className="green">+ R$ 4.288</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <span className="lp-mock-date">Hoje — 30/Ago</span>
              <MockRow icon="🛒" name="Mercado Extra" meta="Alimentação · Nubank" value="− R$ 187,40" />
              <span className="lp-mock-date">Ontem — 29/Ago</span>
              <MockRow icon="💰" name="Salário" meta="Receita · Inter" value="+ R$ 6.800" valueClass="green" />
              <MockRow icon="🏠" name="Aluguel" meta="Moradia · Nubank" value="− R$ 1.800" valueClass="red" />
              <span className="lp-mock-date">27/Ago</span>
              <MockRow icon="⛽" name="Shell Posto" meta="Transporte" value="− R$ 220" />
            </div>
          </div>
        )}

        {preview === 'cards' && (
          <div className="lp-mock-screen lp-mock-cards-page">
            <div className="lp-mock-head lp-mock-head-row">
              <div>
                <b>Cartões</b>
                <small>Faturas e limites</small>
              </div>
              <div className="lp-mock-head-actions">
                <button type="button">Importar OFX</button>
                <button type="button" className="primary">＋ Cartão</button>
              </div>
            </div>
            <div className="lp-mock-month">
              <i>‹</i>
              <div>
                <span>Agosto de 2026</span>
                <small>Soma das faturas</small>
              </div>
              <i>›</i>
            </div>
            <div className="lp-mock-grid2">
              <div className="lp-mock-stat lp-mock-stat-lg">
                <span>💳 Total a pagar</span>
                <b>R$ 4.104,16</b>
              </div>
              <div className="lp-mock-stat lp-mock-chart-stat">
                <span>Evolução das faturas</span>
                <div className="lp-mock-bar-chart">
                  {[32, 28, 35, 41, 38, 52, 48].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} className={i === 5 ? 'hot' : ''} />
                  ))}
                </div>
                <div className="lp-mock-bar-labels">
                  <span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span>
                </div>
              </div>
            </div>
            <div className="lp-mock-cc-card">
              <div className="lp-mock-cc-top">
                <div className="lp-mock-cc-brand">
                  <span className="lp-mock-ico" style={{ background: '#820ad122', borderColor: '#820ad144' }}>💳</span>
                  <div>
                    <b>Nubank · fecha dia 6</b>
                    <small>Crédito</small>
                  </div>
                </div>
                <div className="lp-mock-head-actions">
                  <button type="button">✏️</button>
                  <button type="button" className="primary purple">+ Lançar</button>
                </div>
              </div>
              <span className="lp-mock-cc-label">Fatura estimada</span>
              <strong className="lp-mock-cc-invoice">R$ 2.168,05</strong>
              <div className="lp-mock-cc-dates">
                <span>Fecha <b>dia 6</b></span>
                <span>Vence <b>12 de Setembro</b></span>
              </div>
              <div className="lp-mock-cc-limit-row">
                <span>Limite total</span>
                <b>R$ 13.000,00</b>
              </div>
              <div className="lp-mock-prog lp-mock-cc-prog">
                <i style={{ width: '1%', background: 'var(--mock-primary)' }} />
              </div>
              <div className="lp-mock-cc-usage">
                <span className="blue">● Usado <b>R$ 84,70</b></span>
                <span className="green">● Disponível <b>R$ 12.915,30</b></span>
              </div>
              <div className="lp-mock-cc-list">
                <span className="lp-mock-cc-list-title">Lançamentos (9)</span>
                <div className="lp-mock-cc-item">
                  <div><b>ESPN</b><small>31/07/2026</small></div>
                  <strong className="red">− R$ 10,00</strong>
                </div>
                <div className="lp-mock-cc-item">
                  <div><b>Iphone Air (4/12)</b><small>26/07/2026</small></div>
                  <strong className="red">− R$ 416,67</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview === 'installments' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Parcelas</b>
              <small>Acompanhe e adiante suas parcelas</small>
            </div>
            <div className="lp-mock-grid2">
              <div className="lp-mock-stat">
                <span>Total em parcelas</span>
                <b className="red">R$ 5.964</b>
              </div>
              <div className="lp-mock-stat">
                <span>Parcela mensal</span>
                <b className="amber">R$ 1.240</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">
                <span>📅</span> Seus parcelamentos
              </div>
              <div className="lp-mock-inst">
                <span className="lp-mock-ico" style={{ background: '#2563eb22', borderColor: '#2563eb44' }}>
                  📱
                </span>
                <div>
                  <b>iPhone 15 Pro</b>
                  <small>8/12 pagas · R$ 499/mês · Nubank</small>
                  <div className="lp-mock-prog">
                    <i style={{ width: '67%', background: '#2563eb' }} />
                  </div>
                </div>
                <div className="lp-mock-inst-right">
                  <b>R$ 1.996</b>
                  <small>restam 4x</small>
                </div>
              </div>
              <div className="lp-mock-inst">
                <span className="lp-mock-ico" style={{ background: '#820ad122', borderColor: '#820ad144' }}>
                  💻
                </span>
                <div>
                  <b>MacBook Air M2</b>
                  <small>3/10 pagas · R$ 650/mês · Nubank</small>
                  <div className="lp-mock-prog">
                    <i style={{ width: '30%', background: '#820ad1' }} />
                  </div>
                </div>
                <div className="lp-mock-inst-right">
                  <b>R$ 4.550</b>
                  <small>restam 7x</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview === 'subscriptions' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Assinaturas</b>
              <small>Serviços recorrentes e projeção anual</small>
            </div>
            <div className="lp-mock-grid4">
              <div className="lp-mock-stat">
                <span>📺 Assinaturas</span>
                <b className="purple">6</b>
                <small>ativas</small>
              </div>
              <div className="lp-mock-stat">
                <span>Gasto mensal</span>
                <b className="red">R$ 287,70</b>
              </div>
              <div className="lp-mock-stat">
                <span>Projeção anual</span>
                <b className="amber">R$ 3.452</b>
              </div>
              <div className="lp-mock-stat">
                <span>Média/serviço</span>
                <b className="green">R$ 47,95</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">
                <span>🔁</span> Suas assinaturas
              </div>
              <MockRow icon="🎵" name="Spotify Premium" meta="Todo dia 18 · 💳 Nubank" value="R$ 26,90/mês" />
              <MockRow icon="📺" name="Netflix" meta="Todo dia 5" value="R$ 55,90/mês" />
              <MockRow icon="💪" name="Smart Fit" meta="Todo dia 1" value="R$ 119,90/mês" />
            </div>
          </div>
        )}

        {preview === 'bills' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Contas fixas</b>
              <small>Água, luz, internet e mais</small>
            </div>
            <div className="lp-mock-grid3">
              <div className="lp-mock-stat">
                <span>Total fixo/mês</span>
                <b className="red">R$ 2.776</b>
              </div>
              <div className="lp-mock-stat">
                <span>Pagas este mês</span>
                <b className="green">2</b>
              </div>
              <div className="lp-mock-stat">
                <span>Pendentes</span>
                <b className="amber">3</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">
                <span>🏠</span> Suas contas
              </div>
              <div className="lp-mock-bill">
                <span className="lp-mock-check on">✓</span>
                <span className="lp-mock-ico">🏠</span>
                <div>
                  <b>Aluguel</b>
                  <small>
                    <span className="lp-mock-badge">fixo</span> ✓ Paga este mês
                  </small>
                </div>
                <strong className="green">R$ 1.800</strong>
              </div>
              <div className="lp-mock-bill">
                <span className="lp-mock-check" />
                <span className="lp-mock-ico">⚡</span>
                <div>
                  <b>Conta de Luz</b>
                  <small>
                    <span className="lp-mock-badge">fixo</span> Vence dia 28
                  </small>
                </div>
                <strong className="amber">R$ 210</strong>
              </div>
              <div className="lp-mock-bill">
                <span className="lp-mock-check" />
                <span className="lp-mock-ico">💳</span>
                <div>
                  <b>Nubank · fatura</b>
                  <small>Vence dia 28 · cartão de crédito</small>
                </div>
                <strong className="red">R$ 3.200</strong>
              </div>
            </div>
          </div>
        )}

        {preview === 'goals' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Metas</b>
              <small>Seu progresso financeiro</small>
            </div>
            <div className="lp-mock-goals-hero">
              <div className="lp-mock-goal-widget">
                <span>Guardado</span>
                <b>R$ 33.800</b>
                <small>em 3 metas</small>
              </div>
              <div className="lp-mock-goal-widget">
                <span>Objetivo total</span>
                <b>R$ 52.500</b>
                <small>64% do plano</small>
              </div>
              <div className="lp-mock-goal-widget">
                <span>Concluídas</span>
                <b>
                  1 <span style={{ fontSize: '0.85em', color: 'var(--mock-muted)' }}>/ 3</span>
                </b>
                <small>Continue depositando</small>
              </div>
            </div>
            <div className="lp-mock-goal-card" style={{ ['--goal-accent' as string]: '#2563eb', ['--pct' as string]: 64 }}>
              <div className="lp-mock-goal-top">
                <span className="lp-mock-goal-icon">✈️</span>
                <div>
                  <b>Viagem para Europa</b>
                  <small>142 dias · até 20/Dez/2026</small>
                </div>
                <div className="lp-mock-ring" style={{ ['--pct' as string]: 64, ['--goal-accent' as string]: '#2563eb' }}>
                  <span>64%</span>
                </div>
              </div>
              <div className="lp-mock-goal-amt">
                <b>R$ 8.000</b> de R$ 12.500
              </div>
              <div className="lp-mock-prog">
                <i style={{ width: '64%', background: '#2563eb' }} />
              </div>
              <div className="lp-mock-goal-foot">
                <span>Faltam R$ 4.500</span>
                <button type="button">Depositar</button>
              </div>
            </div>
            <div className="lp-mock-goal-card" style={{ ['--goal-accent' as string]: '#16a34a', ['--pct' as string]: 91 }}>
              <div className="lp-mock-goal-top">
                <span className="lp-mock-goal-icon">🛡️</span>
                <div>
                  <b>Reserva de emergência</b>
                  <small>Meta: R$ 20.000</small>
                </div>
                <div className="lp-mock-ring" style={{ ['--pct' as string]: 91, ['--goal-accent' as string]: '#16a34a' }}>
                  <span>91%</span>
                </div>
              </div>
              <div className="lp-mock-goal-amt">
                <b>R$ 18.200</b> de R$ 20.000
              </div>
              <div className="lp-mock-prog">
                <i style={{ width: '91%', background: '#16a34a' }} />
              </div>
              <div className="lp-mock-goal-foot">
                <span>Faltam R$ 1.800</span>
                <button type="button">Depositar</button>
              </div>
            </div>
          </div>
        )}

        {preview === 'investments' && (
          <div className="lp-mock-screen lp-mock-inv-page">
            <div className="lp-mock-head lp-mock-head-row">
              <div>
                <b>Investimentos</b>
                <small>Rendimentos em tempo real</small>
              </div>
              <button type="button" className="lp-mock-head-actions primary">＋ Adicionar</button>
            </div>

            <div className="lp-mock-hscroll lp-mock-inv-tabs">
              <button type="button">💼 Minha carteira</button>
              <button type="button">★ Favoritos</button>
              <button type="button" className="active">📈 Investidor</button>
              <button type="button">🌐 Mercado ao vivo</button>
            </div>

            <div className="lp-mock-inv-toolbar">
              <nav className="lp-mock-inv-side">
                <button type="button">💡 Ideias</button>
                <button type="button">⭐ Favoritos</button>
              </nav>
              <div className="lp-mock-inv-body">
                <div className="lp-mock-hscroll lp-mock-cat-rail">
                  <div className="lp-mock-cat-group">
                    <span>Brasil · B3</span>
                    <button type="button" className="active">🇧🇷 Ações BR</button>
                    <button type="button">🏢 FIIs</button>
                    <button type="button">🌎 BDRs</button>
                    <button type="button">🧺 ETFs BR</button>
                  </div>
                  <div className="lp-mock-cat-group">
                    <span>Internacional</span>
                    <button type="button">🇺🇸 Ações US</button>
                    <button type="button">🦅 ETFs US</button>
                  </div>
                  <div className="lp-mock-cat-group">
                    <span>Global</span>
                    <button type="button">₿ Cripto</button>
                    <button type="button">📊 Índices</button>
                  </div>
                  <div className="lp-mock-cat-group">
                    <span>Renda fixa</span>
                    <button type="button">📈 Renda fixa</button>
                    <button type="button">🏛 Tesouro</button>
                  </div>
                </div>
                <ScrollHintBar label="Deslize para ver mais categorias" variant="inner" />

                <div className="lp-mock-inv-hero compact">
                  <div>
                    <b>🇧🇷 Ações brasileiras</b>
                    <small>Ações listadas na B3</small>
                  </div>
                  <span className="lp-mock-live"><i />tempo real · ~10s</span>
                </div>

                <div className="lp-mock-hscroll lp-mock-pills">
                  <button type="button" className="active">Maiores altas</button>
                  <button type="button">Maiores baixas</button>
                  <button type="button">Maior preço</button>
                  <button type="button">Mais voláteis</button>
                </div>
                <div className="lp-mock-hscroll lp-mock-pills">
                  <button type="button" className="active">Todos</button>
                  <button type="button">Financeiro</button>
                  <button type="button">Energia</button>
                  <button type="button">Materiais</button>
                  <button type="button">Saúde</button>
                </div>

                <div className="lp-mock-movers">
                  <div className="lp-mock-card">
                    <div className="lp-mock-card-title green">Maiores altas ▲</div>
                    {[['PETR4', '+1,99%', 'R$ 43,55'], ['B3SA3', '+1,96%', 'R$ 16,05'], ['VALE3', '+1,12%', 'R$ 58,90'], ['ITUB4', '+0,88%', 'R$ 38,21']].map(([t, p, v]) => (
                      <div key={t} className="lp-mock-mover-row"><b>{t}</b><span className="green">{p}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                  <div className="lp-mock-card">
                    <div className="lp-mock-card-title red">Maiores baixas ▼</div>
                    {[['MGLU3', '−4,55%', 'R$ 4,62'], ['CYRE3', '−2,10%', 'R$ 18,30'], ['GGBR4', '−1,85%', 'R$ 19,88'], ['WEGE3', '−1,42%', 'R$ 42,10']].map(([t, p, v]) => (
                      <div key={t} className="lp-mock-mover-row"><b>{t}</b><span className="red">{p}</span><strong>{v}</strong></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview === 'community' && (
          <div className="lp-mock-screen lp-mock-community-page">
            <div className="lp-mock-head lp-mock-head-row">
              <div>
                <b>Comunidade</b>
                <small>Sugira melhorias, comente e curta — priorizamos pelo interesse de todos.</small>
              </div>
              <button type="button" className="lp-mock-head-actions primary">＋ Nova sugestão</button>
            </div>
            <div className="lp-mock-notif">
              <p>Ative as notificações para saber quando sua sugestão mudar de coluna (Backlog → Faremos, etc.).</p>
              <button type="button" className="primary">Sim, ativar</button>
              <button type="button">Agora não</button>
            </div>
            <div className="lp-mock-kanban">
              <div className="lp-mock-col">
                <h3>Backlog</h3>
                <p>Ideias em consideração — curta as que mais importam.</p>
                <button type="button" className="lp-mock-kanban-add">Adicionar sugestão +</button>
                <p className="lp-mock-empty">Nenhuma ideia aqui ainda.</p>
              </div>
              <div className="lp-mock-col">
                <h3>Faremos</h3>
                <p>Priorizamos pelo interesse da comunidade.</p>
                <div className="lp-mock-kanban-card">
                  <b>Queria uma parte de investimento em tudo</b>
                  <footer><span>💬 0</span><span>♡ 1</span></footer>
                  <select defaultValue="planned" aria-hidden><option>Faremos</option></select>
                </div>
              </div>
              <div className="lp-mock-col">
                <h3>Estamos cozinhando</h3>
                <p>Em desenvolvimento agora.</p>
                <p className="lp-mock-empty">Nenhuma ideia aqui ainda.</p>
              </div>
              <div className="lp-mock-col">
                <h3>Pronto</h3>
                <p>Já disponível no app.</p>
                <div className="lp-mock-kanban-card">
                  <b>Ajustar a responsividade e layout de comunidade</b>
                  <span>A responsividade não está muito visível.</span>
                  <footer><span>💬 0</span><span>♡ 1</span></footer>
                </div>
                <div className="lp-mock-kanban-card">
                  <b>Exclusão que adicionei errado</b>
                  <span>Preciso excluir cartões de crédito que adicionei a mais.</span>
                  <footer><span>💬 0</span><span>♡ 1</span></footer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
