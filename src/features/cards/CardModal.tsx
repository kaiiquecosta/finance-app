import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { BankPresetPicker } from '@/components/banks/BankPresetPicker'
import { BRAZIL_BANK_PRESETS, type BankPreset } from '@/domain/banks'
import { ZERO, type Cents } from '@/domain/money'
import type { Card as CardEntity } from '@/domain/entities'
import type { CardDraft } from './useCardMutations'
import styles from './CardModal.module.css'

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
  const [presetId, setPresetId] = useState<string | null>(BRAZIL_BANK_PRESETS[0]?.id ?? null)
  const [color, setColor] = useState(BRAZIL_BANK_PRESETS[0]?.color ?? '#8b5cf6')
  const [limit, setLimit] = useState<Cents>(ZERO)
  const [closeDay, setCloseDay] = useState('5')
  const [dueDay, setDueDay] = useState('12')
  const [error, setError] = useState('')

  const pickPreset = (p: BankPreset) => {
    setPresetId(p.id)
    setColor(p.color)
    if (!name.trim() || BRAZIL_BANK_PRESETS.some((b) => b.name === name.trim())) {
      setName(p.name)
    }
  }

  useEffect(() => {
    if (!open) return
    setError('')
    if (editing) {
      setName(editing.name)
      setColor(editing.color)
      setPresetId(null)
      setLimit(editing.limit)
      setCloseDay(String(editing.closeDay))
      setDueDay(String(editing.dueDay))
    } else {
      const first = BRAZIL_BANK_PRESETS[0]
      setName('')
      setPresetId(first?.id ?? null)
      setColor(first?.color ?? '#8b5cf6')
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
      <BankPresetPicker selectedId={presetId} onSelect={pickPreset} />

      <TextField
        label="Nome do cartão"
        name="card-name"
        autoFocus
        placeholder="Ex.: Nubank, Inter…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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
