import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import type { BankAccount, Income, IncomeFrequency } from '@/domain/entities'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './IncomeModal.module.css'

const FREQUENCIES: { id: IncomeFrequency; label: string }[] = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'quinzenal', label: 'Quinzenal' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'variavel', label: 'Variável' },
]

const ICONS = ['💰', '💵', '💼', '🏠', '📈', '🎁', '🧾', '🚀']

export interface IncomeDraft extends Omit<Income, 'id'> {
  id?: number
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: IncomeDraft) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  saving?: boolean
  accounts: BankAccount[]
  userId: string | undefined
  editing?: Income | null
}

export function IncomeModal({
  open,
  onClose,
  onSave,
  onDelete,
  saving,
  accounts,
  userId,
  editing,
}: Props) {
  const [name, setName] = useState('')
  const [amt, setAmt] = useState<Cents>(ZERO)
  const [freq, setFreq] = useState<IncomeFrequency>('mensal')
  const [icon, setIcon] = useState('💰')
  const [days, setDays] = useState<number[]>([5])
  const [dayInput, setDayInput] = useState('')
  const [accountId, setAccountId] = useState<number | null>(null)
  const [auto, setAuto] = useState(true)
  const [error, setError] = useState('')

  // Reseta o formulário só ao abrir ou ao trocar o item em edição — não quando `accounts` muda (ex.: criar conta).
  useEffect(() => {
    if (!open) return
    setError('')
    setDayInput('')
    if (editing) {
      setName(editing.name)
      setAmt(editing.amt)
      setFreq(editing.freq)
      setIcon(editing.icon || '💰')
      setDays(editing.days)
      setAccountId(editing.accountId ?? null)
      setAuto(editing.auto)
    } else {
      setName('')
      setAmt(ZERO)
      setFreq('mensal')
      setIcon('💰')
      setDays([5])
      setAccountId(accounts[0]?.id ?? null)
      setAuto(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accounts omitido de propósito
  }, [open, editing?.id])

  useEffect(() => {
    if (!open || editing) return
    setAccountId((current) => {
      if (current != null && accounts.some((a) => a.id === current)) return current
      return accounts[0]?.id ?? current
    })
  }, [open, editing, accounts])

  const addDay = () => {
    const d = parseInt(dayInput, 10)
    if (!Number.isInteger(d) || d < 1 || d > 31) return setError('Dia inválido (use 1 a 31).')
    if (days.includes(d)) return setDayInput('')
    setDays([...days, d].sort((a, b) => a - b))
    setDayInput('')
    setError('')
  }

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Informe o nome da renda.')
    if (amt <= 0) return setError('Informe um valor maior que zero.')
    if (freq !== 'variavel' && days.length === 0)
      return setError('Adicione ao menos um dia de recebimento.')
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        amt,
        freq,
        icon,
        color: '#22c55e',
        accountId,
        days: freq === 'variavel' ? [] : days,
        // Preserva o histórico de recebimentos ao editar (agora persistido).
        received: editing?.received ?? [],
        auto,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '💰 Editar renda' : '💰 Nova renda'}
      onClose={onClose}
      footer={
        <>
          {editing && onDelete && (
            <Button
              variant="danger"
              onClick={() => void onDelete(editing.id)}
              disabled={saving}
              title="Excluir renda"
            >
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
      <div className={styles.iconRow}>
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
        label="Nome"
        name="income-name"
        autoFocus
        placeholder="Ex.: Salário CLT, Aluguel recebido…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <MoneyField label="Valor por recebimento" value={amt} onChange={setAmt} />

      <div>
        <span className={styles.label}>Recorrência</span>
        <div className={styles.chips}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={freq === f.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              onClick={() => setFreq(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {freq !== 'variavel' && (
        <div>
          <span className={styles.label}>Dias de recebimento</span>
          <div className={styles.chips}>
            {days.map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.chip} ${styles.chipActive}`}
                onClick={() => setDays(days.filter((x) => x !== d))}
                title="Remover"
              >
                dia {d} ✕
              </button>
            ))}
          </div>
          <div className={styles.dayAdd}>
            <TextField
              name="income-day"
              inputMode="numeric"
              placeholder="Dia (1-31)"
              value={dayInput}
              onChange={(e) => setDayInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDay()
                }
              }}
            />
            <Button variant="ghost" onClick={addDay}>
              ＋
            </Button>
          </div>
        </div>
      )}

      <AccountPicker
        label="Para qual conta você recebe?"
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
        userId={userId}
        allowNone={false}
      />

      <label className={styles.check}>
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        <span>Lançar transação automaticamente ao chegar o dia</span>
      </label>

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
