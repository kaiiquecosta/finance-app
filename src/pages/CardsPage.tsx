import { useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useCardMutations } from '@/features/cards/useCardMutations'
import { CardModal } from '@/features/cards/CardModal'
import { PurchaseModal } from '@/features/cards/PurchaseModal'
import { OfxImportModal } from '@/features/cards/OfxImportModal'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatBRL, percentOf, sub, sum } from '@/domain/money'
import { MONTHS_FULL } from '@/domain/categories'
import { formatDate } from '@/lib/format'
import {
  availableLimit,
  billsForMonth,
  getInvoiceMonth,
  invoiceTotal,
  totalAvailableLimit,
} from '@/domain/calc/cards'
import type { Card as CardEntity } from '@/domain/entities'
import styles from './CardsPage.module.css'

export function CardsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const { saveCard, removeCard, addBills } = useCardMutations(user?.id)

  const [monthOffset, setMonthOffset] = useState(0)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editing, setEditing] = useState<CardEntity | null>(null)
  const [purchaseCard, setPurchaseCard] = useState<CardEntity | null>(null)
  const [ofxOpen, setOfxOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  if (isLoading) return <PageHeader title="Cartões" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Cartões" />
        <Card>
          <p className={styles.muted}>Não foi possível carregar seus cartões.</p>
        </Card>
      </>
    )
  }

  const now = new Date()
  const { month, year } = getInvoiceMonth(monthOffset, now)
  const invoiceTotalAll = sum(data.cards.map((c) => invoiceTotal(c, month, year)))
  const availableAll = totalAvailableLimit(data.cards, now)

  const openNewCard = () => {
    setEditing(null)
    setCardModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Cartões"
        subtitle="Faturas e limites"
        action={
          <div className={styles.headerActions}>
            {data.cards.some((c) => c.type === 'credito') && (
              <Button variant="ghost" onClick={() => setOfxOpen(true)}>
                Importar OFX
              </Button>
            )}
            <Button onClick={openNewCard}>＋ Cartão</Button>
          </div>
        }
      />

      {data.cards.length === 0 ? (
        <Card>
          <p className={styles.muted}>
            Nenhum cartão. Cadastre seu cartão de crédito e lance compras (à vista ou parceladas).
          </p>
        </Card>
      ) : (
        <>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={() => setMonthOffset((m) => m - 1)}>
              ‹
            </button>
            <span className={styles.monthLabel}>
              Fatura de {MONTHS_FULL[month]} {year}
            </span>
            <button className={styles.navBtn} onClick={() => setMonthOffset((m) => m + 1)}>
              ›
            </button>
            {monthOffset !== 0 && (
              <button className={styles.today} onClick={() => setMonthOffset(0)}>
                atual
              </button>
            )}
          </div>

          <div className={styles.summary}>
            <Card title="Fatura do mês">
              <div className={styles.num}>{formatBRL(invoiceTotalAll)}</div>
            </Card>
            <Card title="Limite disponível">
              <div className={`${styles.num} ${styles.pos}`}>{formatBRL(availableAll)}</div>
            </Card>
          </div>

          <div className={styles.cards}>
            {data.cards.map((card) => {
              const fat = invoiceTotal(card, month, year)
              const avail = availableLimit(card, now)
              const used = sub(card.limit, avail)
              const usedPct = percentOf(used, card.limit)
              const bills = billsForMonth(card, month, year)
              const isOpen = expanded === card.id
              return (
                <Card key={card.id} className={styles.cardItem}>
                  <div className={styles.cardTop} style={{ borderColor: `${card.color}55` }}>
                    <div className={styles.cardHead}>
                      <span className={styles.cardDot} style={{ background: card.color }} />
                      <button
                        className={styles.cardName}
                        onClick={() => {
                          setEditing(card)
                          setCardModalOpen(true)
                        }}
                      >
                        {card.name} ✏️
                      </button>
                      <span className={styles.cardDue}>vence dia {card.dueDay}</span>
                    </div>
                    <div className={styles.cardFat}>
                      <span className={styles.fatLabel}>Fatura {MONTHS_FULL[month]}</span>
                      <span className={styles.fatValue}>{formatBRL(fat)}</span>
                    </div>
                    <div className={styles.limitBar}>
                      <div
                        className={styles.limitFill}
                        style={{
                          width: `${Math.min(usedPct, 100)}%`,
                          background: usedPct > 85 ? 'var(--red)' : card.color,
                        }}
                      />
                    </div>
                    <div className={styles.limitInfo}>
                      <span>{formatBRL(avail)} disponível</span>
                      <span className={styles.muted}>de {formatBRL(card.limit)}</span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Button onClick={() => setPurchaseCard(card)}>＋ Lançar compra</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setExpanded(isOpen ? null : card.id)}
                    >
                      {isOpen ? 'Ocultar' : `Ver fatura (${bills.length})`}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className={styles.bills}>
                      {bills.length === 0 ? (
                        <p className={styles.muted}>Sem lançamentos nesta fatura.</p>
                      ) : (
                        bills.map((b) => (
                          <div key={b.id} className={styles.bill}>
                            <div className={styles.billInfo}>
                              <span className={styles.billDesc}>{b.description}</span>
                              <span className={styles.billDate}>{formatDate(b.date)}</span>
                            </div>
                            <span className={styles.billAmt}>{formatBRL(b.amt)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
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

      <OfxImportModal
        open={ofxOpen}
        cards={data.cards}
        saving={addBills.isPending}
        onClose={() => setOfxOpen(false)}
        onSave={async (bills) => {
          await addBills.mutateAsync(bills)
          setOfxOpen(false)
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
    </>
  )
}
