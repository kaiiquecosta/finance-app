import { useState } from 'react'
import { NAV_ITEMS } from '@/app/navItems'

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

function TxRow({
  icon,
  name,
  sub,
  value,
  tone = 'expense',
}: {
  icon: string
  name: string
  sub: string
  value: string
  tone?: 'expense' | 'income' | 'warn' | 'danger'
}) {
  return (
    <div className="lp-tx-row">
      <span className="lp-tx-icon">{icon}</span>
      <div>
        <b>{name}</b>
        <small>{sub}</small>
      </div>
      <strong className={tone}>{value}</strong>
    </div>
  )
}

function ProgressRow({
  icon,
  name,
  meta,
  value,
  pct,
  color,
}: {
  icon: string
  name: string
  meta: string
  value: string
  pct: number
  color: string
}) {
  return (
    <div className="lp-progress-row">
      <span className="lp-tx-icon">{icon}</span>
      <div className="lp-progress-body">
        <div className="lp-progress-top">
          <div>
            <b>{name}</b>
            <small>{meta}</small>
          </div>
          <div className="lp-progress-right">
            <strong>{value}</strong>
            <small>{pct}%</small>
          </div>
        </div>
        <div className="lp-progress-bar">
          <i style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
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
          <div className="lp-screen lp-overview">
            <div className="lp-balance">
              <span>Patrimônio total</span>
              <strong>R$ 48.420,80</strong>
              <small>↗ 12,4% este mês</small>
            </div>
            <div className="lp-kpis">
              <div>
                <span>Receitas</span>
                <b className="green">R$ 8.500</b>
              </div>
              <div>
                <span>Gastos</span>
                <b>R$ 4.212</b>
              </div>
              <div>
                <span>Investido</span>
                <b>R$ 1.800</b>
              </div>
            </div>
            <div className="lp-panel lp-chart-panel">
              <div className="lp-panel-title">
                <b>Fluxo do mês</b>
                <span>Últimos 6 meses</span>
              </div>
              <div className="lp-chart">
                {[42, 58, 49, 67, 61, 83, 72, 94, 79, 100, 86, 108].map((h, i) => (
                  <i key={i} style={{ height: `${h / 1.25}%` }} className={i > 8 ? 'hot' : ''} />
                ))}
              </div>
              <div className="lp-months">
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Ago</span>
              </div>
            </div>
            <div className="lp-side-panel lp-panel">
              <div className="lp-panel-title">
                <b>Gastos por categoria</b>
                <span>Agosto</span>
              </div>
              <div className="lp-donut">
                <div>
                  <b>R$ 4,2 mil</b>
                  <span>total</span>
                </div>
              </div>
              <div className="lp-legend">
                <span>
                  <i className="cyan" />
                  Casa
                </span>
                <span>
                  <i className="orange" />
                  Compras
                </span>
                <span>
                  <i className="blue" />
                  Transporte
                </span>
              </div>
            </div>
            <div className="lp-panel lp-recent">
              <div className="lp-panel-title">
                <b>Transações recentes</b>
                <span>Ver todas →</span>
              </div>
              <TxRow icon="🛒" name="Mercado Extra" sub="Alimentação · hoje" value="− R$ 187,40" />
              <TxRow icon="💰" name="Salário" sub="Receita · ontem" value="+ R$ 6.800" tone="income" />
              <TxRow icon="🎵" name="Spotify Premium" sub="Assinatura · 18/Ago" value="− R$ 26,90" />
            </div>
          </div>
        )}

        {preview === 'transactions' && (
          <div className="lp-screen lp-transactions">
            <div className="lp-tx-summary">
              <div>
                <span>Receitas em Agosto</span>
                <b className="green">+ R$ 8.500</b>
              </div>
              <div>
                <span>Gastos em Agosto</span>
                <b className="red">− R$ 4.212</b>
              </div>
            </div>
            <div className="lp-pills">
              <button className="active">Todos</button>
              <button>Receitas</button>
              <button>Gastos</button>
              <button>Alimentação</button>
              <button>Transporte</button>
            </div>
            <div className="lp-panel lp-tx-list">
              <span className="lp-date-label">Hoje — 30/Ago</span>
              <TxRow icon="🛒" name="Mercado Extra" sub="Alimentação" value="− R$ 187,40" />
              <span className="lp-date-label">Ontem — 29/Ago</span>
              <TxRow icon="💰" name="Salário" sub="Receita" value="+ R$ 6.800" tone="income" />
              <TxRow icon="🏠" name="Aluguel" sub="Moradia" value="− R$ 1.800" tone="danger" />
              <span className="lp-date-label">27/Ago</span>
              <TxRow icon="⛽" name="Shell Posto" sub="Transporte" value="− R$ 220" />
              <TxRow icon="🍔" name="iFood" sub="Alimentação" value="− R$ 64,90" />
            </div>
          </div>
        )}

        {preview === 'cards' && (
          <div className="lp-screen lp-cards">
            <div className="lp-card-visual">
              <div className="lp-card-chip" />
              <div className="lp-card-brand">Nubank</div>
              <div className="lp-card-number">•••• •••• •••• 4821</div>
              <div className="lp-card-footer">
                <span>Kaique Costa</span>
                <span>Vence 28 Set</span>
              </div>
            </div>
            <div className="lp-card-stats">
              <div>
                <span>Limite</span>
                <b>R$ 10.000</b>
              </div>
              <div>
                <span>Fatura</span>
                <b>R$ 3.200</b>
              </div>
              <div>
                <span>Disponível</span>
                <b className="green">R$ 6.800</b>
              </div>
            </div>
            <div className="lp-progress-bar lp-card-usage">
              <i style={{ width: '32%', background: 'linear-gradient(90deg,#820ad1,#a53dff)' }} />
            </div>
            <small className="lp-card-usage-label">32% do limite utilizado</small>
            <div className="lp-panel lp-tx-list">
              <div className="lp-panel-title">
                <b>Fatura atual</b>
                <span>3 lançamentos</span>
              </div>
              <TxRow icon="🛒" name="Mercado Extra" sub="30/Ago · à vista" value="− R$ 187,40" />
              <TxRow icon="✈️" name="GOL Passagem" sub="15/Ago · 6x" value="− R$ 183,00" />
              <TxRow icon="🍽️" name="Outback" sub="12/Ago · à vista" value="− R$ 289,00" />
            </div>
          </div>
        )}

        {preview === 'installments' && (
          <div className="lp-screen lp-installments">
            <div className="lp-inst-head">
              <div>
                <span>Total mensal</span>
                <strong>R$ 1.240</strong>
              </div>
              <div className="lp-badge">4 ativos</div>
            </div>
            <div className="lp-panel">
              <ProgressRow
                icon="📱"
                name="iPhone 15 Pro"
                meta="8 de 12 parcelas · 4 restantes"
                value="R$ 499/mês"
                pct={67}
                color="linear-gradient(90deg,#0a84ff,#93c5fd)"
              />
              <ProgressRow
                icon="💻"
                name="MacBook Air M2"
                meta="3 de 10 parcelas · 7 restantes"
                value="R$ 650/mês"
                pct={30}
                color="linear-gradient(90deg,#820ad1,#c084fc)"
              />
              <ProgressRow
                icon="🎮"
                name="PlayStation 5"
                meta="5 de 6 parcelas · 1 restante"
                value="R$ 91/mês"
                pct={83}
                color="linear-gradient(90deg,#16a34a,#86efac)"
              />
            </div>
          </div>
        )}

        {preview === 'subscriptions' && (
          <div className="lp-screen lp-subscriptions">
            <div className="lp-sub-head">
              <div>
                <span>Total mensal</span>
                <strong>R$ 287,70</strong>
              </div>
              <div className="lp-badge green">6 assinaturas</div>
            </div>
            <div className="lp-panel lp-tx-list">
              <TxRow icon="🎵" name="Spotify Premium" sub="Renova todo dia 18" value="R$ 26,90" />
              <TxRow icon="📺" name="Netflix" sub="Renova todo dia 5" value="R$ 55,90" />
              <TxRow icon="☁️" name="iCloud+" sub="Renova todo dia 12" value="R$ 19,90" />
              <TxRow icon="💪" name="Smart Fit" sub="Renova todo dia 1" value="R$ 119,90" />
              <TxRow icon="🎮" name="Xbox Game Pass" sub="Renova todo dia 22" value="R$ 44,95" />
              <TxRow icon="📰" name="NY Times" sub="Renova todo dia 8" value="R$ 20,15" />
            </div>
          </div>
        )}

        {preview === 'bills' && (
          <div className="lp-screen lp-bills">
            <div className="lp-bill-stats">
              <div>
                <b className="green">R$ 1.919</b>
                <span>Pago</span>
              </div>
              <div>
                <b className="warn">R$ 297</b>
                <span>Pendente</span>
              </div>
              <div>
                <b className="red">R$ 560</b>
                <span>A vencer</span>
              </div>
            </div>
            <div className="lp-panel lp-tx-list">
              <TxRow icon="✅" name="Aluguel" sub="Pago em 10/Ago" value="R$ 1.800" tone="income" />
              <TxRow icon="✅" name="Internet Vivo" sub="Pago em 5/Ago" value="R$ 119" tone="income" />
              <TxRow icon="⚡" name="Conta de Luz" sub="Vence em 28/Ago" value="R$ 210" tone="warn" />
              <TxRow icon="💧" name="Conta de Água" sub="Vence em 30/Ago" value="R$ 87" tone="warn" />
              <TxRow icon="🏥" name="Plano de Saúde" sub="Vence em 25/Ago" value="R$ 560" tone="danger" />
            </div>
          </div>
        )}

        {preview === 'goals' && (
          <div className="lp-screen lp-goals">
            <div className="lp-goal-card">
              <div className="lp-goal-top">
                <span>✈️</span>
                <div>
                  <b>Viagem para Europa</b>
                  <small>Meta: R$ 12.500 · até Dez/26</small>
                </div>
                <strong className="blue">64%</strong>
              </div>
              <div className="lp-progress-bar">
                <i style={{ width: '64%', background: 'linear-gradient(90deg,#0a84ff,#93c5fd)' }} />
              </div>
              <div className="lp-goal-foot">
                <span>
                  Guardado: <b>R$ 8.000</b>
                </span>
                <span>Falta: R$ 4.500</span>
              </div>
            </div>
            <div className="lp-goal-card">
              <div className="lp-goal-top">
                <span>🚗</span>
                <div>
                  <b>Entrada do carro</b>
                  <small>Meta: R$ 20.000 · até Jun/27</small>
                </div>
                <strong className="warn">38%</strong>
              </div>
              <div className="lp-progress-bar">
                <i style={{ width: '38%', background: 'linear-gradient(90deg,#f59e0b,#fde68a)' }} />
              </div>
              <div className="lp-goal-foot">
                <span>
                  Guardado: <b>R$ 7.600</b>
                </span>
                <span>Falta: R$ 12.400</span>
              </div>
            </div>
            <div className="lp-goal-card">
              <div className="lp-goal-top">
                <span>🛡️</span>
                <div>
                  <b>Reserva de emergência</b>
                  <small>Meta: R$ 20.000</small>
                </div>
                <strong className="green">91%</strong>
              </div>
              <div className="lp-progress-bar">
                <i style={{ width: '91%', background: 'linear-gradient(90deg,#16a34a,#86efac)' }} />
              </div>
              <div className="lp-goal-foot">
                <span>
                  Guardado: <b>R$ 18.200</b>
                </span>
                <span>Falta: R$ 1.800</span>
              </div>
            </div>
          </div>
        )}

        {preview === 'investments' && (
          <div className="lp-screen lp-investor">
            <div className="lp-invest-head">
              <div>
                <span>Investimentos</span>
                <strong>O mercado, sem ruído.</strong>
              </div>
              <button>＋ Investir</button>
            </div>
            <div className="lp-inv-wallet">
              <div>
                <span>Carteira total</span>
                <b>R$ 29.930</b>
              </div>
              <div className="lp-badge green">CDI 10,65% a.a.</div>
            </div>
            <div className="lp-market-strip">
              <div>
                <span>IBOV</span>
                <b>137.912</b>
                <small>+1,28%</small>
              </div>
              <div>
                <span>DÓLAR</span>
                <b>R$ 5,42</b>
                <small className="red">−0,32%</small>
              </div>
              <div>
                <span>BITCOIN</span>
                <b>US$ 118 mil</b>
                <small>+2,71%</small>
              </div>
            </div>
            <div className="lp-stock-card lp-panel">
              <div className="lp-stock-title">
                <i>B³</i>
                <div>
                  <b>B3 ON</b>
                  <span>B3SA3 · B3</span>
                </div>
                <strong>R$ 16,05</strong>
              </div>
              <svg viewBox="0 0 500 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="linefill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#16a34a" stopOpacity=".28" />
                    <stop offset="1" stopColor="#16a34a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,82 C35,76 58,86 90,66 S145,58 178,62 S230,44 260,49 S315,20 350,35 S402,15 438,24 S470,9 500,12 L500,100 L0,100Z"
                  fill="url(#linefill)"
                />
                <path
                  d="M0,82 C35,76 58,86 90,66 S145,58 178,62 S230,44 260,49 S315,20 350,35 S402,15 438,24 S470,9 500,12"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="3"
                />
              </svg>
              <div className="lp-fundamentals">
                <div>
                  <span>P/L</span>
                  <b>15,12</b>
                </div>
                <div>
                  <span>P/VP</span>
                  <b>4,31</b>
                </div>
                <div>
                  <span>DY</span>
                  <b>4,80%</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {preview === 'community' && (
          <div className="lp-screen lp-community">
            <div className="lp-community-head">
              <span>Comunidade Flux</span>
              <strong>Finanças ficam mais leves quando ideias circulam.</strong>
            </div>
            <div className="lp-community-grid">
              <div className="lp-feed">
                <article>
                  <header>
                    <i>AM</i>
                    <div>
                      <b>Ana Martins</b>
                      <span>Nova sugestão · Backlog</span>
                    </div>
                  </header>
                  <p>Adicionar comparação mensal por categoria na Visão geral.</p>
                  <footer>♡ 24 votos &nbsp;&nbsp; ◯ 8 comentários</footer>
                </article>
                <article>
                  <header>
                    <i>RL</i>
                    <div>
                      <b>Rafael Lima</b>
                      <span>Em desenvolvimento</span>
                    </div>
                  </header>
                  <p>Notificações personalizadas para contas próximas do vencimento.</p>
                  <footer>♡ 63 votos &nbsp;&nbsp; ◯ 14 comentários</footer>
                </article>
              </div>
              <aside>
                <span>Roadmap aberto</span>
                <b>Você ajuda a construir</b>
                <p>Acompanhe ideias do Backlog até chegarem ao app.</p>
                <button>Ver roadmap →</button>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
