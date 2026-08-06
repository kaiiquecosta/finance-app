import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useRates } from '@/data/useMarket'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BankAccountsModal } from '@/features/accounts/BankAccountsModal'
import { IncomeModal } from '@/features/income/IncomeModal'
import { TransactionModal } from '@/features/transactions/TransactionModal'
import { useTransactionMutations } from '@/features/transactions/useTransactionMutations'
import { useEntityMutations } from '@/data/useEntityMutations'
import { toIncomeRow } from '@/data/mappers'
import { HeroInsight } from '@/features/overview/HeroInsight'
import { CategoryDonut } from '@/features/overview/CategoryDonut'
import { CreditLimit } from '@/features/overview/CreditLimit'
import { IncomeList } from '@/features/overview/IncomeList'
import { CardInvoices } from '@/features/overview/CardInvoices'
import { UpcomingBills } from '@/features/overview/UpcomingBills'
import { AnnualView } from '@/features/overview/AnnualView'
import { InvestPotential } from '@/features/overview/InvestPotential'
import { OverviewGoalsSnapshot } from '@/features/overview/OverviewGoalsSnapshot'
import { OverviewInvestmentsSnapshot } from '@/features/overview/OverviewInvestmentsSnapshot'
import { formatBRL } from '@/domain/money'
import { addMonths, parseISODate } from '@/domain/dates'
import { colorFor, iconFor, MONTHS_FULL } from '@/domain/categories'
import {
  consolidatedBalance,
  expenseByCategory,
  summarizeTransactions,
} from '@/domain/calc/overview'
import { formatLongDate, formatRelativeDate } from '@/lib/format'
import { withAlpha } from '@/lib/color'
import type { BankAccount, Income, Transaction } from '@/domain/entities'
import overviewStyles from '@/features/overview/overview.module.css'
import styles from './OverviewPage.module.css'

const RECENT_LIMIT = 6

export function OverviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const incomeMutations = useEntityMutations<Income>('incomes', toIncomeRow, user?.id)
  const txMutations = useTransactionMutations(user?.id)
  const rates = useRates()

  const [accountsOpen, setAccountsOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false)

  const now = new Date()

  if (isLoading) {
    return <PageHeader title="Visão geral" subtitle="Carregando seus dados…" />
  }
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Visão geral" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar seus dados.</p>
        </Card>
      </>
    )
  }

  const month = now.getMonth()
  const year = now.getFullYear()
  const prev = addMonths(month, year, -1)

  const inMonth = (t: Transaction, m: number, y: number) => {
    const d = parseISODate(t.date)
    return d.getMonth() === m && d.getFullYear() === y
  }
  const monthTxs = data.transactions.filter((t) => inMonth(t, month, year))
  const prevMonthTxs = data.transactions.filter((t) => inMonth(t, prev.month, prev.year))

  const balance = consolidatedBalance(data.bankAccounts, data.transactions)
  const summary = summarizeTransactions(monthTxs)
  const byCat = expenseByCategory(data.transactions, data.cards, month, year)
  const cats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCat = cats[0]?.[1] ?? 1
  const recent = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT_LIMIT)
  const accountsById = new Map(data.bankAccounts.map((a) => [a.id, a]))

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle={formatLongDate(now)}
        action={
          <Button className="btn-glow" onClick={() => setQuickExpenseOpen(true)}>
            ＋ Gasto rápido
          </Button>
        }
      />

      <Card className={overviewStyles.incomeCard} title="💰 Minhas rendas" action={
        <Button variant="primary" onClick={() => { setEditingIncome(null); setIncomeOpen(true) }}>
          ＋ {data.incomes.length ? 'Renda' : 'Renda'}
        </Button>
      }>
        {data.incomes.length === 0 ? (
          <p className={styles.muted}>Nenhuma renda cadastrada.</p>
        ) : (
          <IncomeList
            incomes={data.incomes}
            asOf={now}
            onEdit={(inc) => {
              setEditingIncome(inc)
              setIncomeOpen(true)
            }}
          />
        )}
      </Card>

      <HeroInsight monthTxs={monthTxs} prevMonthTxs={prevMonthTxs} byCat={byCat} />

      <div className="grid2" style={{ marginTop: 16, marginBottom: 16 }}>
        <Card
          title="🏦 Contas correntes"
          action={
            <button type="button" className="card-link" onClick={() => setAccountsOpen(true)}>
              gerenciar →
            </button>
          }
        >
          <div className={`num-lg ${balance < 0 ? 'num-red' : ''}`}>{formatBRL(balance)}</div>
          <div className={styles.hint}>saldo total</div>
          <div className="divider" />
          <div className="stat-row">
            <span className="stat-label">↑ Receitas</span>
            <span className="stat-val num-green">{formatBRL(summary.income)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">↓ Gastos</span>
            <span className="stat-val num-red">{formatBRL(summary.spent)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">✦ Sobrou</span>
            <span className={`stat-val ${summary.balance >= 0 ? 'num-green' : 'num-red'}`}>
              {formatBRL(summary.balance, { sign: true })}
            </span>
          </div>
        </Card>

        <Card
          title="🍩 Gastos por categoria"
          action={
            <button type="button" className="card-link" onClick={() => navigate('/app/transacoes')}>
              ver todas →
            </button>
          }
        >
          <CategoryDonut byCat={byCat} />
        </Card>
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <Card
          title="💳 Limite disponível"
          action={
            <button type="button" className="card-link" onClick={() => navigate('/app/cartoes')}>
              ver detalhes →
            </button>
          }
        >
          <CreditLimit cards={data.cards} asOf={now} />
        </Card>

        <Card title={`🏷 Principais categorias · ${MONTHS_FULL[month]}`}>
          {cats.length === 0 ? (
            <p className={styles.muted}>Sem gastos neste mês.</p>
          ) : (
            cats.map(([cat, amount]) => (
              <div key={cat} className="cat-row">
                <div className="cat-name">
                  <span>{iconFor(cat)}</span>
                  {cat}
                </div>
                <div className="cat-bar-wrap">
                  <div className="prog">
                    <div
                      className="prog-fill"
                      style={{ width: `${(amount / maxCat) * 100}%`, background: colorFor(cat) }}
                    />
                  </div>
                </div>
                <div className="cat-amt">{formatBRL(amount)}</div>
              </div>
            ))
          )}
        </Card>
      </div>

      <CardInvoices
        cards={data.cards}
        subscriptions={data.subscriptions}
        asOf={now}
        onSeeBills={() => navigate('/app/contas')}
      />

      <Card
        title="↕ Transações recentes"
        action={
          <button type="button" className="card-link" onClick={() => navigate('/app/transacoes')}>
            ver todas →
          </button>
        }
      >
        {recent.length === 0 ? (
          <p className={styles.muted}>Nenhuma transação neste mês.</p>
        ) : (
          recent.map((t) => (
            <TxRow
              key={t.id}
              tx={t}
              account={t.accountId != null ? accountsById.get(t.accountId) : undefined}
            />
          ))
        )}
      </Card>

      <Card
        style={{ marginTop: 16 }}
        title="📅 Gastos previstos — contas fixas"
        action={
          <button type="button" className="card-link" onClick={() => navigate('/app/contas')}>
            gerenciar →
          </button>
        }
      >
        <UpcomingBills bills={data.fixedBills} asOf={now} onAdd={() => navigate('/app/contas')} />
      </Card>

      <div className="grid2" style={{ marginTop: 16, marginBottom: 16 }}>
        <AnnualView
          year={year}
          txs={data.transactions}
          cards={data.cards}
          subscriptions={data.subscriptions}
          currentMonth={month}
        />
        <InvestPotential year={year} txs={data.transactions} fixedBills={data.fixedBills} />
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <OverviewGoalsSnapshot
          goals={data.goals}
          onSeeAll={() => navigate('/app/metas')}
          onAdd={() => navigate('/app/metas')}
        />
        <OverviewInvestmentsSnapshot
          investments={data.investments}
          market={rates.data ? { cdi: rates.data.cdi, ipca: rates.data.ipca } : null}
          onSeeAll={() => navigate('/app/investimentos')}
          onAdd={() => navigate('/app/investimentos')}
        />
      </div>

      <BankAccountsModal
        open={accountsOpen}
        onClose={() => setAccountsOpen(false)}
        userId={user?.id}
        accounts={data.bankAccounts}
        transactions={data.transactions}
      />

      <IncomeModal
        open={incomeOpen}
        editing={editingIncome}
        accounts={data.bankAccounts}
        saving={incomeMutations.save.isPending || incomeMutations.remove.isPending}
        onClose={() => setIncomeOpen(false)}
        onSave={async (draft) => {
          await incomeMutations.save.mutateAsync(draft)
          setIncomeOpen(false)
        }}
        onDelete={async (id) => {
          await incomeMutations.remove.mutateAsync(id)
          setIncomeOpen(false)
        }}
      />

      <TransactionModal
        open={quickExpenseOpen}
        accounts={data.bankAccounts}
        saving={txMutations.save.isPending}
        onClose={() => setQuickExpenseOpen(false)}
        onSave={async (draft) => {
          await txMutations.save.mutateAsync(draft)
          setQuickExpenseOpen(false)
        }}
      />
    </>
  )
}

function TxRow({ tx, account }: { tx: Transaction; account?: BankAccount }) {
  const positive = tx.amt >= 0
  const catColor = colorFor(tx.cat)
  return (
    <div className="fadein" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          background: withAlpha(catColor, 0.09),
          border: `1px solid ${withAlpha(catColor, 0.16)}`,
        }}
      >
        {iconFor(tx.cat)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 6, marginTop: 2 }}>
          <span className="badge badge-muted">{tx.cat}</span>
          {account && (
            <span className="badge" style={{ color: account.color, border: `1px solid ${withAlpha(account.color, 0.25)}` }}>
              {account.name}
            </span>
          )}
          <span>{formatRelativeDate(tx.date)}</span>
        </div>
      </div>
      <span className={positive ? 'num-green' : 'num-red'} style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>
        {formatBRL(tx.amt, { sign: true })}
      </span>
    </div>
  )
}
