import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import type { Card as CardEntity } from '@/domain/entities'
import type { CardDraft } from './useCardMutations'
import styles from './CardModal.module.css'

const COLORS = [
  { name: 'Nubank', color: '#8b5cf6' },
  { name: 'Inter', color: '#f97316' },
  { name: 'Itaú', color: '#f59e0b' },
  { name: 'C6', color: '#334155' },
  { name: 'Santander', color: '#dc2626' },
  { name: 'XP', color: '#111827' },
  { name: 'Bradesco', color: '#ef4444' },
  { name: 'Azul', color: '#3b82f6' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: CardDraft) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  saving?: boolean
  editing?: CardEntity | null
}

export function CardModal({ open, onClose, onSave, onDelete, saving, editing }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0].color)
  const [limit, setLimit] = useState<Cents>(ZERO)
  const [closeDay, setCloseDay] = useState('5')
  const [dueDay, setDueDay] = useState('12')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setColor(editing.color)
      setLimit(editing.limit)
      setCloseDay(String(editing.closeDay))
      setDueDay(String(editing.dueDay))
    } else {
      setName('')
      setColor(COLORS[0].color)
      setLimit(ZERO)
      setCloseDay('5')
      setDueDay('12')
    }
  }, [open, editing])

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Informe o nome do cartão.')
    const close = parseInt(closeDay, 10)
    const due = parseInt(dueDay, 10)
    if (!(close >= 1 && close <= 31)) return setError('Dia de fechamento inválido (1 a 31).')
    if (!(due >= 1 && due <= 31)) return setError('Dia de vencimento inválido (1 a 31).')
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        color,
        limit,
        closeDay: close,
        dueDay: due,
        type: 'credito',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '💳 Editar cartão' : '💳 Novo cartão'}
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
      <TextField
        label="Nome do cartão"
        name="card-name"
        autoFocus
        placeholder="Ex.: Nubank, Inter…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div>
        <span className={styles.label}>Cor / banco</span>
        <div className={styles.chips}>
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              className={color === c.color ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => {
                setColor(c.color)
                if (!name.trim()) setName(c.name)
              }}
            >
              <span className={styles.dot} style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <MoneyField label="Limite total" value={limit} onChange={setLimit} />

      <div className={styles.days}>
        <TextField
          label="Fecha dia"
          name="card-close"
          inputMode="numeric"
          value={closeDay}
          onChange={(e) => setCloseDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
        />
        <TextField
          label="Vence dia"
          name="card-due"
          inputMode="numeric"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
