import { colorFor, iconFor } from '@/domain/categories'
import type { BankAccount, Transaction } from '@/domain/entities'
import { formatBRL } from '@/domain/money'
import { isManualExpenseTransaction } from '@/domain/transactions'
import { formatRelativeDate } from '@/lib/format'
import { parseISODate } from '@/domain/dates'

type Props = {
  transactions: Transaction[]
  accounts: BankAccount[]
  onEdit?: (t: Transaction) => void
}

function dateGroupLabel(iso: string): string {
  const d = parseISODate(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function GroupedTransactionList({ transactions, accounts, onEdit }: Props) {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }
  const dates = [...groups.keys()].sort((a, b) => b.localeCompare(a))

  if (dates.length === 0) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, padding: '6px 0' }}>
        Nenhuma transação neste mês. Clique em <b>＋ Nova</b> para lançar a primeira.
      </p>
    )
  }

  return (
    <div className="fadein">
      {dates.map((date) => (
        <div key={date}>
          <div className="tx-date-hdr">{dateGroupLabel(date)}</div>
          {groups.get(date)!.map((t) => {
            const editable = isManualExpenseTransaction(t)
            const catColor = colorFor(t.cat)
            const acc = t.accountId != null ? accounts.find((a) => a.id === t.accountId) : null
            return (
              <div
                key={t.id}
                className={['tx-row fadein', editable && onEdit ? 'clickable' : ''].filter(Boolean).join(' ')}
                role={editable && onEdit ? 'button' : undefined}
                tabIndex={editable && onEdit ? 0 : undefined}
                onClick={() => editable && onEdit?.(t)}
                onKeyDown={(e) => {
                  if (editable && onEdit && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onEdit(t)
                  }
                }}
              >
                <div
                  className="tx-ico"
                  style={{
                    background: `${catColor}18`,
                    border: `1px solid ${catColor}28`,
                  }}
                >
                  {iconFor(t.cat)}
                </div>
                <div className="tx-info">
                  <div className="tx-name">{t.name}</div>
                  <div className="tx-meta">
                    <span className="badge badge-muted" style={{ padding: '1px 7px' }}>
                      {t.cat}
                    </span>
                    {acc && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: `${acc.color}20`,
                          border: `1px solid ${acc.color}40`,
                          borderRadius: 6,
                          padding: '2px 7px',
                          fontSize: 10,
                          fontWeight: 600,
                          color: acc.color,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: acc.color,
                            display: 'inline-block',
                          }}
                        />
                        {acc.name}
                      </span>
                    )}
                    <span>{formatRelativeDate(t.date)}</span>
                  </div>
                </div>
                <div className="tx-amt" style={{ color: t.amt >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {formatBRL(t.amt, { sign: true })}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
