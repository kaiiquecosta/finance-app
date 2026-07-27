import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import { iconFor } from '@/domain/categories'
import type { FixedBill } from '@/domain/entities'
import styles from './FixedBillModal.module.css'

const CATEGORIES = [
  'aluguel',
  'condomínio',
  'energia',
  'água',
  'internet',
  'gás',
  'streaming',
  'saúde',
  'educação',
  'transporte',
  'outros',
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: Omit<FixedBill, 'id'> & { id?: number }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  saving?: boolean
  editing?: FixedBill | null
}

export function FixedBillModal({ open, onClose, onSave, onDelete, saving, editing }: Props) {
  const [name, setName] = useState('')
  const [amt, setAmt] = useState<Cents>(ZERO)
  const [dueDay, setDueDay] = useState('10')
  const [category, setCategory] = useState('aluguel')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setAmt(editing.amt)
      setDueDay(String(editing.dueDay))
      setCategory(editing.category || 'outros')
    } else {
      setName('')
      setAmt(ZERO)
      setDueDay('10')
      setCategory('aluguel')
    }
  }, [open, editing])

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Informe o nome da conta.')
    if (amt <= 0) return setError('Informe o valor.')
    const d = parseInt(dueDay, 10)
    if (!Number.isInteger(d) || d < 1 || d > 31) return setError('Dia de vencimento inválido (1 a 31).')
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        amt,
        dueDay: d,
        icon: iconFor(category),
        color: '#3b82f6',
        category,
        paid: editing?.paid ?? false,
        paidAt: editing?.paidAt ?? null,
        paidAmount: editing?.paidAmount ?? null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '🏠 Editar conta fixa' : '🏠 Nova conta fixa'}
      onClose={onClose}
      footer={
        <>
          {editing && onDelete && (
            <Button variant="danger" onClick={() => void onDelete(editing.id)} disabled={saving}>
              🗑
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void submit()}>
            {editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <div>
        <span className={styles.label}>Categoria</span>
        <div className={styles.chips}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => setCategory(c)}
            >
              <span aria-hidden>{iconFor(c)}</span> {c}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Nome da conta"
        name="bill-name"
        autoFocus
        placeholder="Ex.: Aluguel, Luz, Internet…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <MoneyField label="Valor" value={amt} onChange={setAmt} />

      <TextField
        label="Dia do vencimento"
        name="bill-day"
        inputMode="numeric"
        placeholder="1 a 31"
        value={dueDay}
        onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
      />

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
