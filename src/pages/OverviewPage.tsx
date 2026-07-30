import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BankAccountsModal } from '@/features/accounts/BankAccountsModal'
import { IncomeModal } from '@/features/income/IncomeModal'
import { useEntityMutations } from '@/data/useEntityMutations'
import { toIncomeRow } from '@/data/mappers'
import { formatBRL } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { MONTHS_FULL, colorFor, iconFor } from '@/domain/categories'
import { consolidatedBalance, expenseByCategory, summarizeTransactions } from '@/domain/calc/overview'
import { receiptStatus, totalMonthlyExpected, totalReceived } from '@/domain/calc/income'
import { formatRelativeDate } from '@/lib/format'
import type { Income, Transaction } from '@/domain/entities'
import styles from './OverviewPage.module.css'

export function OverviewPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const incomeMutations = useEntityMutations<Income>('incomes', toIncomeRow, user?.id)

  const [accountsOpen, setAccountsOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const now = new Date()
  const monthLabel = `${MONTHS_FULL[now.getMonth()]} de ${now.getFullYear()}`

  if (isLoading) {
    return <PageHeader title="Visão geral" subtitle="Carregando seus dados…" />
  }
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Visão geral" />
        <Card>
          <p className={styles.muted}>
            Não foi possível carregar seus dados. Verifique a conexão e tente novamente.
          </p>
        </Card>
      </>
    )
  }

  const month = now.getMonth()
  const year = now.getFullYear()
  const monthTxs = data.transactions.filter((t) => {
    const d = parseISODate(t.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const balance = consolidatedBalance(data.bankAccounts, data.transactions)
  const summary = summarizeTransactions(monthTxs)
  const byCat = expenseByCategory(data.transactions, data.cards, month, year)
  const cats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxCat = cats[0]?.[1] ?? 1
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  const empty =
    !data.transactions.length && !data.bankAccounts.length && !data.cards.length

  return (
    <>
      <PageHeader title="Visão geral" subtitle={monthLabel} />

      {empty && (
        <Card>
          <p className={styles.muted}>
            👋 Bem-vindo! Comece adicionando suas contas bancárias e lançando transações — seu
            painel se preenche automaticamente.
          </p>
        </Card>
      )}

      <div className={styles.grid}>
        <Card
          title="Saldo consolidado"
          action={
            <button className={styles.cardLink} onClick={() => setAccountsOpen(true)}>
              gerenciar
            </button>
          }
        >
          <div className={`${styles.big} ${balance < 0 ? styles.neg : ''}`}>
            {formatBRL(balance)}
          </div>
          <p className={styles.hint}>
            {data.bankAccounts.length === 0
              ? 'Nenhuma conta — clique em gerenciar para adicionar'
              : `${data.bankAccounts.length} conta(s) · saldo inicial + transações`}
          </p>
        </Card>

        <Card title={`Este mês · ${MONTHS_FULL[month]}`}>
          <div className={styles.rows}>
            <Row label="Receitas" value={formatBRL(summary.income)} tone="pos" />
            <Row label="Gastos" value={formatBRL(summary.spent)} tone="neg" />
            <div className={styles.divider} />
            <Row
              label="Saldo do mês"
              value={formatBRL(summary.balance, { sign: true })}
              tone={summary.balance >= 0 ? 'pos' : 'neg'}
              strong
            />
          </div>
        </Card>
      </div>

      <Card
        title="Minhas rendas"
        className={styles.mt}
        action={
          <Button
            variant="ghost"
            onClick={() => {
              setEditingIncome(null)
              setIncomeOpen(true)
            }}
          >
            ＋ {data.incomes.length ? 'Outra renda' : 'Renda'}
          </Button>
        }
      >
        {data.incomes.length === 0 ? (
          <p className={styles.muted}>
            Nenhuma renda cadastrada. Adicione seu salário para ver o previsto do mês.
          </p>
        ) : (
          <>
            <div className={styles.txs}>
              {data.incomes.map((inc) => {
                const status = receiptStatus(inc, now)
                return (
                  <button
                    key={inc.id}
                    className={styles.incomeRow}
                    onClick={() => {
                      setEditingIncome(inc)
                      setIncomeOpen(true)
                    }}
                  >
                    <span className={styles.txIcon}>{inc.icon}</span>
                    <div className={styles.txInfo}>
                      <span className={styles.txName}>{inc.name}</span>
                      <span className={styles.txSub}>
                        {inc.freq}
                        {inc.days.length > 0 && ` · ${inc.days.map((d) => `dia ${d}`).join(', ')}`}
                      </span>
                    </div>
                    <div className={styles.incomeRight}>
                      <span className={styles.pos}>{formatBRL(inc.amt)}</span>
                      <span className={styles.txSub}>
                        {status === 'full'
                          ? '✓ recebido'
                          : status === 'partial'
                            ? 'parcial'
                            : 'a receber'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className={styles.divider} />
            <div className={styles.rows}>
              <Row
                label="Total mensal previsto"
                value={formatBRL(totalMonthlyExpected(data.incomes))}
                tone="pos"
              />
              <Row
                label="Recebido este mês"
                value={formatBRL(totalReceived(data.incomes, now))}
              />
            </div>
          </>
        )}
      </Card>

      <Card title="Gastos por categoria" className={styles.mt}>
        {cats.length === 0 ? (
          <p className={styles.muted}>Sem gastos neste mês ainda.</p>
        ) : (
          <div className={styles.cats}>
            {cats.map(([cat, amount]) => (
              <div key={cat} className={styles.catRow}>
                <span className={styles.catIcon}>{iconFor(cat)}</span>
                <div className={styles.catBarWrap}>
                  <div className={styles.catTop}>
                    <span className={styles.catName}>{cat}</span>
                    <span className={styles.catVal}>{formatBRL(amount)}</span>
                  </div>
                  <div className={styles.bar}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${(amount / maxCat) * 100}%`, background: colorFor(cat) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Transações recentes" className={styles.mt}>
        {recent.length === 0 ? (
          <p className={styles.muted}>Nenhuma transação ainda.</p>
        ) : (
          <div className={styles.txs}>
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} />
            ))}
          </div>
        )}
      </Card>

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
    </>
  )
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
  strong?: boolean
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span
        className={[
          styles.rowValue,
          strong ? styles.rowStrong : '',
          tone === 'pos' ? styles.pos : tone === 'neg' ? styles.neg : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </span>
    </div>
  )
}

function TxRow({ tx }: { tx: Transaction }) {
  const positive = tx.amt >= 0
  return (
    <div className={styles.tx}>
      <span className={styles.txIcon}>{iconFor(tx.cat)}</span>
      <div className={styles.txInfo}>
        <span className={styles.txName}>{tx.name}</span>
        <span className={styles.txSub}>{formatRelativeDate(tx.date)}</span>
      </div>
      <span className={positive ? styles.pos : styles.neg}>
        {formatBRL(tx.amt, { sign: true })}
      </span>
    </div>
  )
}
