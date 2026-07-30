import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, allocate, formatBRL, type Cents } from '@/domain/money'
import { parseISODate, toISODate } from '@/domain/dates'
import { newId } from '@/data/useEntityMutations'
import type { Card as CardEntity, CardBill } from '@/domain/entities'
import styles from './PurchaseModal.module.css'

interface Props {
  open: boolean
  card: CardEntity | null
  onClose: () => void
  onSave: (bills: CardBill[]) => Promise<void>
  saving?: boolean
}

const QUICK_PARCELS = [1, 2, 3, 6, 10, 12]

/** Gera as faturas (1 para à vista, N para parcelado) a partir da compra. */
function buildBills(cardId: number, desc: string, total: Cents, date: string, parcels: number): CardBill[] {
  if (parcels <= 1) {
    return [{ id: newId(), cardId, description: desc, amt: total, date, pastPaid: false, recurring: false }]
  }
  const parts = allocate(total, parcels)
  const base = parseISODate(date)
  return parts.map((amt, i) => ({
    id: newId() + i,
    cardId,
    description: `${desc} (${i + 1}/${parcels})`,
    amt,
    date: toISODate(new Date(base.getFullYear(), base.getMonth() + i, base.getDate())),
    pastPaid: false,
    recurring: false,
  }))
}

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

  const submit = async () => {
    setError('')
    if (!card) return
    if (!desc.trim()) return setError('Descreva a compra.')
    if (total <= 0) return setError('Informe o valor.')
    try {
      await onSave(buildBills(card.id, desc.trim(), total, date, parcels))
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

      {parcels > 1 && total > 0 && (
        <p className={styles.preview}>
          {parcels}x de <b>{formatBRL(perParcel)}</b> = {formatBRL(total)}
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
