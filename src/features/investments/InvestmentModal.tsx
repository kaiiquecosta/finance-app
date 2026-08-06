import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import type { BankAccount, InvestmentType } from '@/domain/entities'
import type { InvestmentDraft } from './useInvestmentMutations'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import styles from './InvestmentModal.module.css'

type ExtraField = 'pct' | 'spread' | 'yield' | null

interface TypeDef {
  id: InvestmentType
  label: string
  icon: string
  field: ExtraField
  fieldLabel?: string
  fieldDefault?: number
}

const TYPES: TypeDef[] = [
  { id: 'cdb', label: 'CDB', icon: '🏦', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 100 },
  { id: 'lci', label: 'LCI/LCA', icon: '🌿', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 95 },
  { id: 'selic', label: 'Tesouro Selic', icon: '🏛️', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 100 },
  { id: 'ipca', label: 'Tesouro IPCA+', icon: '📊', field: 'spread', fieldLabel: 'Spread sobre IPCA (% a.a.)', fieldDefault: 6 },
  { id: 'poupanca', label: 'Poupança', icon: '🐷', field: null },
  { id: 'acoes', label: 'Ações BR', icon: '📈', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 12 },
  { id: 'acoeseua', label: 'Ações EUA', icon: '🇺🇸', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 10 },
  { id: 'fii', label: 'FIIs', icon: '🏢', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 10 },
  { id: 'cripto', label: 'Cripto', icon: '₿', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 15 },
  { id: 'outro', label: 'Outro', icon: '💼', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 10 },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: InvestmentDraft) => Promise<void>
  saving?: boolean
  accounts: BankAccount[]
  userId: string | undefined
}

export function InvestmentModal({ open, onClose, onSave, saving, accounts, userId }: Props) {
  const [typeId, setTypeId] = useState<InvestmentType>('cdb')
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [date, setDate] = useState(toISODate(new Date()))
  const [extra, setExtra] = useState(100)
  const [debitAccountId, setDebitAccountId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const type = TYPES.find((t) => t.id === typeId) ?? TYPES[0]

  useEffect(() => {
    if (!open) return
    setError('')
    setTypeId('cdb')
    setName('')
    setBank('')
    setAmount(ZERO)
    setDate(toISODate(new Date()))
    setExtra(100)
    setDebitAccountId(accounts[0]?.id ?? null)
  }, [open, accounts])

  const selectType = (t: TypeDef) => {
    setTypeId(t.id)
    if (t.field && t.fieldDefault != null) setExtra(t.fieldDefault)
  }

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Dê um nome ao investimento.')
    if (amount <= 0) return setError('Informe o valor aplicado.')
    try {
      await onSave({
        name: name.trim(),
        bank: bank.trim(),
        amount,
        date,
        type: typeId,
        pct: type.field === 'pct' ? extra : 0,
        spread: type.field === 'spread' ? extra : 0,
        yield: type.field === 'yield' ? extra : 0,
        ticker: null,
        accountId: debitAccountId,
        debitAccountId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title="📈 Novo investimento"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving} onClick={() => void submit()}>
            Aplicar
          </Button>
        </>
      }
    >
      <div>
        <span className={styles.label}>Tipo</span>
        <div className={styles.types}>
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={typeId === t.id ? `${styles.type} ${styles.typeActive}` : styles.type}
              onClick={() => selectType(t)}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Nome"
        name="inv-name"
        placeholder="Ex.: CDB Nubank 110%, PETR4…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <TextField
        label="Instituição / corretora (opcional)"
        name="inv-bank"
        placeholder="Ex.: Nubank, XP, Binance…"
        value={bank}
        onChange={(e) => setBank(e.target.value)}
      />

      <MoneyField label="Valor aplicado" value={amount} onChange={setAmount} />

      {type.field && (
        <TextField
          label={type.fieldLabel}
          name="inv-extra"
          inputMode="decimal"
          value={String(extra)}
          onChange={(e) => setExtra(Number(e.target.value.replace(',', '.')) || 0)}
        />
      )}

      <TextField
        label="Data da aplicação"
        name="inv-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <AccountPicker
        label="De qual conta saiu o dinheiro?"
        accounts={accounts}
        value={debitAccountId}
        onChange={setDebitAccountId}
        userId={userId}
      />

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
