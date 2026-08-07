import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useCardMutations } from '@/features/cards/useCardMutations'
import { CardModal } from '@/features/cards/CardModal'
import { PurchaseModal } from '@/features/cards/PurchaseModal'
import { PageHeader } from '@/components/PageHeader'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { InvoiceEvolutionChart } from '@/components/legacy/InvoiceEvolutionChart'
import { MonthNav, labelMonthYear, monthOffsetFrom } from '@/components/legacy/MonthNav'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatBRL, percentOf, sub, sum } from '@/domain/money'
import { MONTHS_FULL } from '@/domain/categories'
import {
  availableLimit,
  billsForMonth,
  cardDisplayName,
  getInvoiceMonth,
  invoicePaymentDue,
  invoiceTotal,
} from '@/domain/calc/cards'
import { bankButtonTextColor } from '@/domain/banks'
import type { Card as CardEntity, CardBill } from '@/domain/entities'
import { showSaveToast } from '@/lib/toast'
import { formatDate } from '@/lib/format'
import styles from './CardsPage.module.css'

export function CardsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { saveCard, removeCard, addBills, removeBill } = useCardMutations(user?.id)

  const [monthOffset, setMonthOffset] = useState(0)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editing, setEditing] = useState<CardEntity | null>(null)
  const [purchaseCard, setPurchaseCard] = useState<CardEntity | null>(null)
  const [confirmDeleteBill, setConfirmDeleteBill] = useState<CardBill | null>(null)

  const now = new Date()

  if (isLoading) return <PageHeader title="Cartões" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Cartões" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar seus cartões.</p>
        </div>
      </>
    )
  }

  const { month, year } = getInvoiceMonth(monthOffset, now)
  const invoiceTotalAll = sum(data.cards.map((c) => invoiceTotal(c, month, year)))

  const openNewCard = () => {
    setEditing(null)
    setCardModalOpen(true)
  }

  const goCurrentBill = () => {
    if (data.cards.length === 0) {
      setMonthOffset(0)
      return
    }
    const ref = data.cards[0]
    let cm = now.getMonth()
    let cy = now.getFullYear()
    if (now.getDate() > ref.closeDay) {
      cm++
      if (cm > 11) {
        cm = 0
        cy++
      }
    }
    setMonthOffset(monthOffsetFrom(cm, cy, now))
  }

  return (
    <>
      <PageHeader
        title="Cartões"
        subtitle="Faturas e limites"
        action={<HeaderActionButton onClick={openNewCard}>＋ Cartão</HeaderActionButton>}
      />

      {data.cards.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhum cartão. Cadastre seu cartão de crédito e lance compras (à vista ou parceladas).
          </p>
        </div>
      ) : (
        <>
          <MonthNav
            month={month}
            year={year}
            monthOffset={monthOffset}
            label={labelMonthYear(month, year)}
            hint="Soma das faturas"
            pickable
            onPrev={() => setMonthOffset((m) => m - 1)}
            onNext={() => setMonthOffset((m) => m + 1)}
            onGoToday={goCurrentBill}
            onPickMonth={(m, y) => setMonthOffset(monthOffsetFrom(m, y, now))}
          />

          <div className="grid2" style={{ marginBottom: 16 }}>
            <div className="card card-sm" style={{ textAlign: 'center' }}>
              <div className="card-label">💳 Total a pagar</div>
              <div className="num-lg">{formatBRL(invoiceTotalAll)}</div>
            </div>
            <div className="card card-sm">
              <div className="card-label">Evolução das faturas</div>
              <InvoiceEvolutionChart
                cards={data.cards}
                monthOffset={monthOffset}
                asOf={now}
                onSelectOffset={setMonthOffset}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.cards.map((card) => {
              const fat = invoiceTotal(card, month, year)
              const avail = availableLimit(card, now)
              const used = sub(card.limit, avail)
              const usedPct = percentOf(used, card.limit)
              const bills = billsForMonth(card, month, year)
              const due = invoicePaymentDue(month, year)
              return (
                <div
                  key={card.id}
                  className="cc-card fadein"
                  style={{ ['--card-accent' as string]: card.color }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${card.color}20`,
                          border: `1px solid ${card.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}
                      >
                        💳
                      </div>
                      <div>
                        <div style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--num)' }}>
                          {cardDisplayName(card, data.cards)}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{card.type === 'debito' ? 'Débito' : 'Crédito'}</div>
                      </div>
                    </div>
                    <div className={styles.cardHeadActions}>
                      <button
                        type="button"
                        title="Editar cartão"
                        className={styles.ccEditBtn}
                        onClick={() => {
                          setEditing(card)
                          setCardModalOpen(true)
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className={styles.ccLaunchBtn}
                        style={{
                          color: bankButtonTextColor(card.color),
                        }}
                        onClick={() => setPurchaseCard(card)}
                      >
                        + Lançar
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      color: 'var(--muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: 4,
                    }}
                  >
                    Fatura estimada
                  </div>
                  <div className="num-xl" style={{ marginBottom: 10 }}>
                    {formatBRL(fat)}
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      Fecha <b style={{ color: 'var(--text)' }}>dia {card.closeDay}</b>
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      Vence{' '}
                      <b style={{ color: 'var(--text)' }}>
                        {card.dueDay} de {MONTHS_FULL[due.month]}
                      </b>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>Limite total</span>
                    <span style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--num)' }}>
                      {formatBRL(card.limit)}
                    </span>
                  </div>
                  <div className="prog" style={{ height: 7, marginBottom: 8 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${Math.min(usedPct, 100)}%`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--blue)', fontSize: 12, fontWeight: 600 }}>
                      ● Usado <span style={{ color: 'var(--text)', fontFamily: 'var(--num)' }}>{formatBRL(used)}</span>
                    </span>
                    <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>
                      ● Disponível{' '}
                      <span style={{ color: 'var(--text)', fontFamily: 'var(--num)' }}>{formatBRL(avail)}</span>
                    </span>
                  </div>

                  {bills.length > 0 ? (
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
                      <div
                        style={{
                          color: 'var(--muted)',
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          marginBottom: 8,
                        }}
                      >
                        Lançamentos ({bills.length})
                      </div>
                      <div className={styles.billsScroll}>
                        {bills.map((b) => (
                          <div key={b.id} className={styles.billRow}>
                            <div className={styles.billRowMain}>
                              <div className={styles.billText}>
                                <span className={styles.billDesc}>{b.description}</span>
                                <span className={styles.billDate}>Compra {formatDate(b.date)}</span>
                              </div>
                              <span className={styles.billAmt}>-{formatBRL(b.amt)}</span>
                            </div>
                            <button
                              type="button"
                              className={styles.billDel}
                              title="Excluir lançamento"
                              disabled={removeBill.isPending}
                              onClick={() => setConfirmDeleteBill(b)}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: 'var(--muted)',
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      Sem lançamentos nesta fatura
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <CardModal
        open={cardModalOpen}
        editing={editing}
        saving={saveCard.isPending || removeCard.isPending}
        onClose={() => setCardModalOpen(false)}
        onSave={async (draft) => {
          await saveCard.mutateAsync(draft)
          setCardModalOpen(false)
        }}
        onDelete={async (id) => {
          await removeCard.mutateAsync(id)
          setCardModalOpen(false)
        }}
      />

      <PurchaseModal
        open={purchaseCard !== null}
        card={purchaseCard}
        saving={addBills.isPending}
        onClose={() => setPurchaseCard(null)}
        onSave={async (bills) => {
          await addBills.mutateAsync(bills)
          setPurchaseCard(null)
        }}
      />

      <Modal
        open={confirmDeleteBill !== null}
        title="Excluir lançamento"
        onClose={() => setConfirmDeleteBill(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteBill(null)} disabled={removeBill.isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={removeBill.isPending}
              onClick={() => {
                if (!confirmDeleteBill) return
                void removeBill.mutateAsync(confirmDeleteBill.id).then(() => {
                  showSaveToast('Lançamento removido', 'var(--muted)', undefined, '🗑️')
                  setConfirmDeleteBill(null)
                })
              }}
            >
              Excluir
            </Button>
          </>
        }
      >
        {confirmDeleteBill && (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
            Remover <b style={{ color: 'var(--text)' }}>{confirmDeleteBill.description}</b> (
            {formatBRL(confirmDeleteBill.amt)}) desta fatura? Isso não pode ser desfeito.
          </p>
        )}
      </Modal>
    </>
  )
}
