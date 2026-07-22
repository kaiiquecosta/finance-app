import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatBRL } from '@/domain/money'
import { parseISODate } from '@/domain/dates'
import { MONTHS_FULL, colorFor, iconFor } from '@/domain/categories'
import { consolidatedBalance, expenseByCategory, summarizeTransactions } from '@/domain/calc/overview'
import { formatRelativeDate } from '@/lib/format'
import type { Transaction } from '@/domain/entities'
import styles from './OverviewPage.module.css'

export function OverviewPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)

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
        <Card title="Saldo consolidado">
          <div className={`${styles.big} ${balance < 0 ? styles.neg : ''}`}>
            {formatBRL(balance)}
          </div>
          <p className={styles.hint}>
            {data.bankAccounts.length} conta(s) · saldo inicial + transações
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
