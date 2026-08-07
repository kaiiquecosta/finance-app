import { formatBRL } from '@/domain/money'
import { matchBankPreset } from '@/domain/banks'
import { BankMark } from '@/components/banks/BankMark'
import { monthKey, receiptKey, receiptStatus, totalMonthlyExpected, totalReceived } from '@/domain/calc/income'
import type { BankAccount, Income } from '@/domain/entities'
import styles from './IncomeList.module.css'

function dayStatusLabel(day: number, diff: number, received: boolean): string {
  if (received) return `✓ Recebido · dia ${day}`
  if (diff < 0) return `Pendente · dia ${day}`
  if (diff === 0) return 'Receber hoje'
  if (diff === 1) return 'Amanhã'
  return `Dia ${day}`
}

function dayCardTone(diff: number, received: boolean): string {
  if (received) return styles.cardReceived
  if (diff < 0) return styles.cardOverdue
  if (diff === 0) return styles.cardToday
  if (diff === 1) return styles.cardSoon
  return styles.cardPending
}

function bankLabel(accounts: Map<number, BankAccount>, accountId?: number | null): string {
  if (accountId == null) return 'Conta não definida'
  const acc = accounts.get(accountId)
  if (!acc) return 'Conta não encontrada'
  return acc.name
}

function bankPresetForAccount(accounts: Map<number, BankAccount>, accountId?: number | null) {
  if (accountId == null) {
    return { mark: '?', color: '#64748b' as const }
  }
  const acc = accounts.get(accountId)
  if (!acc) return { mark: '?', color: '#64748b' as const }
  return (
    matchBankPreset(acc.name) ?? {
      id: `custom-${acc.id}`,
      name: acc.name,
      color: acc.color,
      mark: acc.name.slice(0, 2),
    }
  )
}

type IncomeDayRow = { income: Income; day: number | null }

function expandIncomeRows(incomes: Income[]): IncomeDayRow[] {
  const rows: IncomeDayRow[] = []
  for (const income of incomes) {
    if (income.freq === 'variavel' || income.days.length === 0) {
      rows.push({ income, day: null })
    } else {
      for (const d of [...income.days].sort((a, b) => a - b)) {
        rows.push({ income, day: d })
      }
    }
  }
  return rows
}

export function IncomeList({
  incomes,
  accounts,
  asOf,
  onEdit,
}: {
  incomes: Income[]
  accounts: BankAccount[]
  asOf: Date
  onEdit: (inc: Income) => void
}) {
  const expected = totalMonthlyExpected(incomes)
  const received = totalReceived(incomes, asOf)
  const today = asOf.getDate()
  const mk = monthKey(asOf)
  const accountsById = new Map(accounts.map((a) => [a.id, a]))
  const rows = expandIncomeRows(incomes)

  return (
    <>
      <div className={styles.list}>
        {rows.map(({ income: inc, day }) => {
          const status = receiptStatus(inc, asOf)
          const bank = bankPresetForAccount(accountsById, inc.accountId)
          const bankName = bankLabel(accountsById, inc.accountId)

          let diff = 0
          let receivedDay = false
          if (day != null) {
            diff = day - today
            receivedDay = inc.received.includes(receiptKey(mk, day))
          }

          const tone =
            day != null ? dayCardTone(diff, receivedDay) : status === 'full' ? styles.cardReceived : styles.cardPending

          return (
            <button
              key={day != null ? `${inc.id}-d${day}` : `${inc.id}-var`}
              type="button"
              className={`${styles.dayCard} ${tone}`}
              onClick={() => onEdit(inc)}
            >
              <span className={styles.incomeIcon} aria-hidden>
                {inc.icon}
              </span>

              <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                  <span className={styles.incomeName}>{inc.name}</span>
                  {day != null && <span className={styles.dayPill}>dia {day}</span>}
                </div>

                <div className={styles.bankRow}>
                  <BankMark preset={bank} size="sm" />
                  <span className={styles.bankName}>{bankName}</span>
                </div>

                {day == null && (
                  <span className={styles.freqMeta}>
                    {inc.freq}
                    {status === 'full' ? ' · ✓ recebido' : status === 'partial' ? ' · parcial' : ' · a receber'}
                  </span>
                )}
              </div>

              <div className={styles.cardEnd}>
                <div className={`num-green ${styles.amount}`}>{formatBRL(inc.amt)}</div>
                {day != null ? (
                  <span className={styles.statusLine}>{dayStatusLabel(day, diff, receivedDay)}</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      <div className={styles.totals}>
        <div className="stat-row">
          <span className="stat-label">Total mensal previsto</span>
          <span className="stat-val num-green">{formatBRL(expected)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Recebido este mês</span>
          <span className="stat-val">{formatBRL(received)}</span>
        </div>
      </div>
    </>
  )
}
