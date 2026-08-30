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
          <span className="lp-avatar">KC</span>
        </div>

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
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Cartões</b>
              <small>Limites, faturas e lançamentos</small>
            </div>
            <div
              className="lp-mock-card"
              style={{
                background: 'linear-gradient(135deg,#820ad1,#5c0c8b)',
                color: '#fff',
                border: 'none',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>Nubank</div>
              <div style={{ margin: '12px 0', letterSpacing: 2, fontSize: 14 }}>•••• •••• •••• 4821</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, opacity: 0.85 }}>
                <span>Kaique Costa</span>
                <span>Vence 28 Set</span>
              </div>
            </div>
            <div className="lp-mock-grid3">
              <div className="lp-mock-stat">
                <span>Limite</span>
                <b>R$ 10.000</b>
              </div>
              <div className="lp-mock-stat">
                <span>Fatura</span>
                <b className="red">R$ 3.200</b>
              </div>
              <div className="lp-mock-stat">
                <span>Disponível</span>
                <b className="green">R$ 6.800</b>
              </div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-card-title">Fatura atual</div>
              <MockRow icon="🛒" name="Mercado Extra" meta="30/Ago · à vista" value="− R$ 187,40" />
              <MockRow icon="✈️" name="GOL Passagem" meta="15/Ago · 6x" value="− R$ 183,00" />
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
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Investimentos</b>
              <small>Rendimentos em tempo real</small>
            </div>
            <div className="lp-mock-inv-tabs">
              <button type="button">💼 Minha carteira</button>
              <button type="button">★ Favoritos</button>
              <button type="button" className="active">
                📈 Investidor
              </button>
              <button type="button">🌐 Mercado ao vivo</button>
            </div>
            <div className="lp-mock-inv-hero">
              <div className="lp-mock-inv-brand">
                <b>📈 Investidor</b>
                <small>Hub completo · ações, FIIs, ETFs, cripto e mais</small>
              </div>
              <span className="lp-mock-live">
                <i />
                tempo real · ~10s
              </span>
            </div>
            <div className="lp-mock-inv-layout">
              <nav className="lp-mock-sidebar" aria-hidden>
                <label>Brasil · B3</label>
                <button type="button" className="active">
                  🇧🇷 Ações BR
                </button>
                <button type="button">🏢 FIIs</button>
                <button type="button">🧺 ETFs BR</button>
                <label>Internacional</label>
                <button type="button">🇺🇸 Ações US</button>
                <button type="button">₿ Cripto</button>
              </nav>
              <div className="lp-mock-card lp-mock-quote-table">
                <div className="lp-mock-card-title">🇧🇷 Ações BR · cotações ao vivo</div>
                <div className="lp-mock-quote-head">
                  <span>Ativo</span>
                  <span>Preço</span>
                  <span>Var.</span>
                </div>
                <div className="lp-mock-quote-row">
                  <div>
                    <b>B3SA3</b>
                    <small>B3 ON · B3</small>
                  </div>
                  <strong>R$ 16,05</strong>
                  <strong className="green">+2,31%</strong>
                </div>
                <div className="lp-mock-quote-row">
                  <div>
                    <b>PETR4</b>
                    <small>Petrobras · B3</small>
                  </div>
                  <strong>R$ 38,42</strong>
                  <strong className="green">+1,04%</strong>
                </div>
                <div className="lp-mock-quote-row">
                  <div>
                    <b>VALE3</b>
                    <small>Vale · B3</small>
                  </div>
                  <strong>R$ 58,90</strong>
                  <strong className="red">−0,48%</strong>
                </div>
                <div className="lp-mock-quote-row">
                  <div>
                    <b>BBSE3</b>
                    <small>BB Seguridade · B3</small>
                  </div>
                  <strong>R$ 36,84</strong>
                  <strong className="green">+1,18%</strong>
                </div>
              </div>
            </div>
            <div className="lp-mock-grid3" style={{ marginTop: 10 }}>
              <div className="lp-mock-stat">
                <span>P/L</span>
                <b>15,12</b>
              </div>
              <div className="lp-mock-stat">
                <span>P/VP</span>
                <b>4,31</b>
              </div>
              <div className="lp-mock-stat">
                <span>DY</span>
                <b>4,80%</b>
              </div>
            </div>
          </div>
        )}

        {preview === 'community' && (
          <div className="lp-mock-screen">
            <div className="lp-mock-head">
              <b>Comunidade</b>
              <small>Sugira, vote e acompanhe o que entra no app</small>
            </div>
            <div className="lp-mock-kanban">
              <div className="lp-mock-col">
                <h3>Backlog</h3>
                <p>Ideias em consideração — curta as que mais importam.</p>
                <button type="button" className="lp-mock-kanban-add">
                  Adicionar sugestão +
                </button>
                <div className="lp-mock-kanban-card">
                  <b>Comparar gastos mês a mês na Visão geral</b>
                  <span>Ver evolução por categoria entre meses.</span>
                  <footer>
                    <span>💬 8</span>
                    <span>♡ 42</span>
                  </footer>
                </div>
              </div>
              <div className="lp-mock-col">
                <h3>Faremos</h3>
                <p>Priorizamos pelo interesse da comunidade.</p>
                <div className="lp-mock-kanban-card">
                  <b>Notificações de contas a vencer</b>
                  <span>Aviso antes do vencimento de contas fixas.</span>
                  <footer>
                    <span>💬 14</span>
                    <span>♡ 63</span>
                  </footer>
                </div>
              </div>
              <div className="lp-mock-col">
                <h3>Estamos cozinhando</h3>
                <p>Em desenvolvimento agora.</p>
                <div className="lp-mock-kanban-card">
                  <b>Importação OFX melhorada</b>
                  <span>Reconciliar faturas com menos cliques.</span>
                  <footer>
                    <span>💬 6</span>
                    <span>♡ 28</span>
                  </footer>
                </div>
              </div>
              <div className="lp-mock-col">
                <h3>Pronto</h3>
                <p>Já disponível no app.</p>
                <div className="lp-mock-kanban-card">
                  <b>Gráfico de categorias com cores vivas</b>
                  <span>Donut sem tons de cinza nas categorias.</span>
                  <footer>
                    <span>💬 11</span>
                    <span>♡ 91</span>
                  </footer>
                </div>
                <div className="lp-mock-kanban-card">
                  <b>Investidor com cotações em tempo real</b>
                  <span>Atualização a cada ~10s no pregão.</span>
                  <footer>
                    <span>💬 19</span>
                    <span>♡ 74</span>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
