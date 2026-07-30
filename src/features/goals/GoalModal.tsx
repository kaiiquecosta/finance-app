import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import type { Goal } from '@/domain/entities'
import styles from './GoalModal.module.css'

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '💻', '🏖️', '👶', '🚀', '💰', '🎁']

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: Omit<Goal, 'id'> & { id?: number }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  saving?: boolean
  editing?: Goal | null
}

export function GoalModal({ open, onClose, onSave, onDelete, saving, editing }: Props) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState<Cents>(ZERO)
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setTarget(editing.target)
      setDeadline(editing.deadline ?? '')
      setIcon(editing.icon || '🎯')
    } else {
      setName('')
      setTarget(ZERO)
      setDeadline('')
      setIcon('🎯')
    }
  }, [open, editing])

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Dê um nome para a meta.')
    if (target <= 0) return setError('Informe o valor alvo.')
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        target,
        saved: editing?.saved ?? ZERO,
        icon,
        color: '#22c55e',
        deadline: deadline || null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '🎯 Editar meta' : '🎯 Nova meta'}
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
            {editing ? 'Salvar' : 'Criar meta'}
          </Button>
        </>
      }
    >
      <div className={styles.icons}>
        {ICONS.map((i) => (
          <button
            key={i}
            type="button"
            className={icon === i ? `${styles.icon} ${styles.iconActive}` : styles.icon}
            onClick={() => setIcon(i)}
          >
            {i}
          </button>
        ))}
      </div>

      <TextField
        label="Nome da meta"
        name="goal-name"
        autoFocus
        placeholder="Ex.: Viagem, Reserva de emergência…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <MoneyField label="Valor alvo" value={target} onChange={setTarget} />

      <TextField
        label="Prazo (opcional)"
        name="goal-deadline"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
