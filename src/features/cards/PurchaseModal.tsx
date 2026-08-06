import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, allocate, formatBRL, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { invoicePaymentDue } from '@/domain/calc/cards'
import { MONTHS_FULL } from '@/domain/categories'
import type { Card as CardEntity } from '@/domain/entities'
import {
  buildCardPurchaseBills,
  previewPurchaseInvoices,
} from '@/features/cards/buildCardPurchaseBills'
import styles from './PurchaseModal.module.css'

interface Props {
  open: boolean
  card: CardEntity | null
  onClose: () => void
  onSave: (bills: ReturnType<typeof buildCardPurchaseBills>) => Promise<void>
  saving?: boolean
}

const QUICK_PARCELS = [1, 2, 3, 6, 10, 12]

export function PurchaseModal({ open, card, onClose, onSave, saving }: Props) {
  const [desc, setDesc] = useState('')
  const [total, setTotal] = useState<Cents>(ZERO)
  const [date, setDate] = useState(toISODate(new Date()))
  const [parcels, setParcels] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setDesc('')
    setTotal(ZERO)
    setDate(toISODate(new Date()))
    setParcels(1)
  }, [open])

  const perParcel = useMemo(
    () => (parcels > 1 && total > 0 ? allocate(total, parcels)[0] : total),
    [total, parcels],
  )

  const invoicePreview = useMemo(() => {
    if (!card || !date) return []
    const label = desc.trim() || 'Compra'
    return previewPurchaseInvoices(date, card.closeDay, parcels, label)
  }, [card, date, parcels, desc])

  const submit = async () => {
    setError('')
    if (!card) return
    if (!desc.trim()) return setError('Descreva a compra.')
    if (total <= 0) return setError('Informe o valor.')
    try {
      await onSave(
        buildCardPurchaseBills(card.id, desc.trim(), total, date, parcels),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível lançar.')
    }
  }

  if (!card) return null

  return (
    <Modal
      open={open}
      title={`Lançar em "${card.name}"`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void submit()}>
            Lançar
          </Button>
        </>
      }
    >
      <p className={styles.hint}>
        Fechamento dia <b>{card.closeDay}</b> · vencimento dia <b>{card.dueDay}</b>. A fatura de
        cada lançamento depende da <b>data da compra</b> (compra após o fechamento vai para o mês
        seguinte).
      </p>

      <TextField
        label="Descrição"
        name="purchase-desc"
        autoFocus
        placeholder="Ex.: iPhone, Mercado, Passagem…"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <MoneyField label="Valor total" value={total} onChange={setTotal} />

      <div>
        <span className={styles.label}>Parcelas</span>
        <div className={styles.chips}>
          {QUICK_PARCELS.map((p) => (
            <button
              key={p}
              type="button"
              className={parcels === p ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => setParcels(p)}
            >
              {p === 1 ? 'À vista' : `${p}x`}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Data da compra"
        name="purchase-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {invoicePreview.length > 0 && (
        <div className={styles.invoicePreview}>
          <span className={styles.label}>Em qual fatura entra</span>
          <ul className={styles.invoiceList}>
            {invoicePreview.map((line, i) => {
              const due = invoicePaymentDue(line.invoiceMonth, line.invoiceYear)
              return (
                <li key={i}>
                  <span>{line.label}</span>
                  <span className={styles.invoiceMeta}>
                    Fatura {MONTHS_FULL[line.invoiceMonth]}/{line.invoiceYear} · vence{' '}
                    {card.dueDay}/{MONTHS_FULL[due.month]}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {parcels > 1 && total > 0 && (
        <p className={styles.preview}>
          {parcels}x de <b>{formatBRL(perParcel)}</b> = {formatBRL(total)}
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
