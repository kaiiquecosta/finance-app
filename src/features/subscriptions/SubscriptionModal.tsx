import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import type { Card as CardEntity, Subscription } from '@/domain/entities'
import styles from './SubscriptionModal.module.css'

const ICONS = ['🔁', '🎬', '🎵', '▶️', '🏰', '🎭', '📦', '🍎', '💪', '🎮', '📱', '☁️']

/** Detecta um ícone provável pelo nome do serviço. */
function detectSubscriptionIcon(name: string): string {
  const n = name.toLowerCase()
  if (/netflix/.test(n)) return '🎬'
  if (/spotify|deezer|tidal|apple music/.test(n)) return '🎵'
  if (/youtube/.test(n)) return '▶️'
  if (/disney/.test(n)) return '🏰'
  if (/hbo|max\b/.test(n)) return '🎭'
  if (/amazon|prime/.test(n)) return '📦'
  if (/apple|icloud/.test(n)) return '🍎'
  if (/gym|academia|smart ?fit|fitness/.test(n)) return '💪'
  if (/xbox|playstation|ps ?plus|nintendo|game ?pass/.test(n)) return '🎮'
  if (/google|drive|dropbox|onedrive/.test(n)) return '☁️'
  return '🔁'
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: Omit<Subscription, 'id'> & { id?: number }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  saving?: boolean
  cards: CardEntity[]
  editing?: Subscription | null
}

export function SubscriptionModal({ open, onClose, onSave, onDelete, saving, cards, editing }: Props) {
  const [name, setName] = useState('')
  const [amt, setAmt] = useState<Cents>(ZERO)
  const [day, setDay] = useState('1')
  const [icon, setIcon] = useState('🔁')
  const [iconTouched, setIconTouched] = useState(false)
  const [cardId, setCardId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setIconTouched(false)
    if (editing) {
      setName(editing.name)
      setAmt(editing.amt)
      setDay(String(editing.day))
      setIcon(editing.icon || '🔁')
      setCardId(editing.cardId ?? null)
    } else {
      setName('')
      setAmt(ZERO)
      setDay('1')
      setIcon('🔁')
      setCardId(null)
    }
  }, [open, editing])

  const onName = (value: string) => {
    setName(value)
    if (!iconTouched) setIcon(detectSubscriptionIcon(value))
  }

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Informe o nome do serviço.')
    if (amt <= 0) return setError('Informe o valor mensal.')
    const d = parseInt(day, 10)
    if (!Number.isInteger(d) || d < 1 || d > 31) return setError('Dia de cobrança inválido (1 a 31).')
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        amt,
        day: d,
        icon,
        color: '#8b5cf6',
        cardId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '🔁 Editar assinatura' : '🔁 Nova assinatura'}
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
      <div className={styles.icons}>
        {ICONS.map((i) => (
          <button
            key={i}
            type="button"
            className={icon === i ? `${styles.icon} ${styles.iconActive}` : styles.icon}
            onClick={() => {
              setIcon(i)
              setIconTouched(true)
            }}
          >
            {i}
          </button>
        ))}
      </div>

      <TextField
        label="Serviço"
        name="sub-name"
        autoFocus
        placeholder="Ex.: Netflix, Spotify, Academia…"
        value={name}
        onChange={(e) => onName(e.target.value)}
      />

      <MoneyField label="Valor mensal" value={amt} onChange={setAmt} />

      <TextField
        label="Dia da cobrança"
        name="sub-day"
        inputMode="numeric"
        placeholder="1 a 31"
        value={day}
        onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
      />

      {cards.length === 0 ? (
        <p className={styles.hintCard}>
          Cadastre um cartão em <b>Cartões</b> para vincular a cobrança a um cartão específico.
        </p>
      ) : (
        <div>
          <label className={styles.label} htmlFor="sub-card-select">
            Cartão de crédito (opcional)
          </label>
          <select
            id="sub-card-select"
            data-testid="subscription-card-select"
            className={styles.select}
            value={cardId ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setCardId(v === '' ? null : Number(v))
            }}
          >
            <option value="">Sem cartão / débito em conta</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className={styles.chips} aria-hidden>
            {cards.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cardId === c.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                onClick={() => setCardId(cardId === c.id ? null : c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
