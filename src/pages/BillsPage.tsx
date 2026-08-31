import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useBillMutations } from '@/features/bills/useBillMutations'
import { FixedBillModal } from '@/features/bills/FixedBillModal'
import { PayBillModal } from '@/features/bills/PayBillModal'
import { PageHeader } from '@/components/PageHeader'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { formatBRL, sum } from '@/domain/money'
import { upcomingCardInvoices } from '@/domain/calc/cards'
import type { FixedBill } from '@/domain/entities'

type Row =
  | { kind: 'fixed'; dueDay: number; bill: FixedBill }
  | { kind: 'card'; dueDay: number; invoiceId: string; cardName: string; color: string; amt: FixedBill['amt'] }

export function BillsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { save, remove, setPaid } = useBillMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FixedBill | null>(null)
  const [payBill, setPayBill] = useState<FixedBill | null>(null)

  if (isLoading) return <PageHeader title="Contas fixas" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Contas fixas" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar suas contas.</p>
        </div>
      </>
    )
  }

  const fixedBills = [...data.fixedBills].sort((a, b) => a.dueDay - b.dueDay)
  const totalFixed = sum(fixedBills.map((b) => b.amt))
  const paidCount = fixedBills.filter((b) => b.paid).length
  const pendingCount = fixedBills.filter((b) => !b.paid).length

  const cardInvoices = upcomingCardInvoices(data.cards, new Date(), 1)

  const rows: Row[] = [
    ...fixedBills.map((bill): Row => ({ kind: 'fixed', dueDay: bill.dueDay, bill })),
    ...cardInvoices.map(
      (inv): Row => ({
        kind: 'card',
        dueDay: inv.dueDay,
        invoiceId: inv.id,
        cardName: inv.cardName,
        color: inv.color,
        amt: inv.amt,
      }),
    ),
  ].sort((a, b) => a.dueDay - b.dueDay)

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Contas fixas"
        subtitle="Água, luz, internet e mais"
        action={<HeaderActionButton onClick={openNew}>＋ Nova conta</HeaderActionButton>}
      />

      {rows.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhuma conta fixa. Cadastre aluguel, luz, internet… e acompanhe os vencimentos.
          </p>
        </div>
      ) : (
        <>
          <div className="grid3" style={{ marginBottom: 20 }}>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Total fixo/mês</div>
              <div className="num-md num-red">{formatBRL(totalFixed)}</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Pagas este mês</div>
              <div className="num-md num-green">{paidCount}</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">Pendentes</div>
              <div className="num-md" style={{ color: 'var(--amber)' }}>
                {pendingCount}
              </div>
            </div>
          </div>

          <div className="card fadein">
            <div className="card-title">
              <span className="icon">🏠</span> Suas contas
            </div>
            {rows.map((row) =>
              row.kind === 'fixed' ? (
                <div
                  key={`fixed-${row.bill.id}`}
                  className={['bill-row fadein', row.bill.paid ? 'paid' : ''].filter(Boolean).join(' ')}
                >
                  <button
                    type="button"
                    title={row.bill.paid ? 'Marcar como não paga' : 'Marcar como paga'}
                    disabled={setPaid.isPending}
                    onClick={() => {
                      if (row.bill.paid) {
                        void setPaid.mutateAsync({
                          bill: row.bill,
                          paid: false,
                        })
                      } else {
                        setPayBill(row.bill)
                      }
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: `2px solid ${row.bill.paid ? 'var(--green)' : 'var(--muted2)'}`,
                      background: row.bill.paid ? 'var(--green)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: '#000',
                    }}
                  >
                    {row.bill.paid ? '✓' : ''}
                  </button>
                  <div
                    className="tx-ico"
                    style={{
                      filter: row.bill.paid ? 'grayscale(0.5)' : 'none',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {row.bill.icon}
                  </div>
                  <div className="tx-info" style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: row.bill.paid ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(255,255,255,0.25)',
                      }}
                    >
                      <span
                        className="tx-name"
                        style={{ color: row.bill.paid ? 'var(--muted)' : 'var(--text)', fontWeight: 600 }}
                      >
                        {row.bill.name}
                      </span>
                      <span className="badge badge-muted">fixo</span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 2,
                        color: row.bill.paid ? 'var(--green)' : 'var(--muted)',
                        fontWeight: 500,
                      }}
                    >
                      {row.bill.paid ? '✓ Paga este mês' : `Vence dia ${row.bill.dueDay}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      className="num-md"
                      style={{
                        fontSize: 15,
                        color: row.bill.paid ? 'var(--green)' : 'var(--text)',
                      }}
                    >
                      {formatBRL(row.bill.amt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => {
                      setEditing(row.bill)
                      setModalOpen(true)
                    }}
                    style={{
                      background: 'var(--card2)',
                      border: '1px solid var(--border2)',
                      borderRadius: 8,
                      width: 30,
                      height: 30,
                      color: 'var(--muted)',
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    ✎
                  </button>
                </div>
              ) : (
                <div key={`card-${row.invoiceId}`} className="bill-row fadein">
                  <div style={{ width: 28, flexShrink: 0 }} />
                  <div
                    className="tx-ico"
                    style={{
                      background: `${row.color}20`,
                      border: `1px solid ${row.color}40`,
                    }}
                  >
                    💳
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{row.cardName} · fatura</div>
                    <div className="tx-meta">Vence dia {row.dueDay} · cartão de crédito</div>
                  </div>
                  <div className="num-md" style={{ fontSize: 15 }}>
                    {formatBRL(row.amt)}
                  </div>
                  <Link
                    to="/app/cartoes"
                    className="card-link"
                    style={{
                      background: 'rgba(239,68,68,0.07)',
                      border: '1px solid rgba(239,68,68,0.18)',
                      borderRadius: 8,
                      padding: '5px 9px',
                      color: '#f87171',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ver →
                  </Link>
                </div>
              ),
            )}
          </div>
        </>
      )}

      <FixedBillModal
        open={modalOpen}
        editing={editing}
        saving={save.isPending || remove.isPending}
        onClose={() => setModalOpen(false)}
        onSave={async (draft) => {
          await save.mutateAsync(draft)
          setModalOpen(false)
        }}
        onDelete={async (id) => {
          await remove.mutateAsync(id)
          setModalOpen(false)
        }}
      />

      <PayBillModal
        open={payBill !== null}
        bill={payBill}
        accounts={data.bankAccounts}
        userId={user?.id}
        saving={setPaid.isPending}
        onClose={() => setPayBill(null)}
        onConfirm={async (accountId) => {
          if (payBill) await setPaid.mutateAsync({ bill: payBill, paid: true, accountId })
          setPayBill(null)
        }}
      />
    </>
  )
}
