import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { BankPresetPicker } from '@/components/banks/BankPresetPicker'
import { BankMark } from '@/components/banks/BankMark'
import { useEntityMutations, newId } from '@/data/useEntityMutations'
import { toBankAccountRow } from '@/data/mappers'
import { ZERO, type Cents } from '@/domain/money'
import { BRAZIL_BANK_PRESETS, matchBankPreset, type BankPreset } from '@/domain/banks'
import type { AccountType, BankAccount } from '@/domain/entities'
import styles from './AccountPicker.module.css'

const ACCOUNT_TYPES: { id: AccountType; label: string }[] = [
  { id: 'corrente', label: 'Corrente' },
  { id: 'poupanca', label: 'Poupança' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'investimento', label: 'Investimento' },
]

interface Props {
  label?: string
  accounts: BankAccount[]
  value: number | null
  onChange: (accountId: number | null) => void
  userId: string | undefined
  allowNone?: boolean
  noneLabel?: string
  /** Exibir saldo inicial ao criar conta (modal de contas). */
  showInitialBalance?: boolean
}

function accountVisual(a: BankAccount): BankPreset {
  return (
    matchBankPreset(a.name) ?? {
      id: `custom-${a.id}`,
      name: a.name,
      color: a.color,
      mark: a.name.slice(0, 2),
    }
  )
}

/** Seleção de conta com chips coloridos e fluxo “Adicionar conta” + bancos. */
export function AccountPicker({
  label = 'Conta',
  accounts,
  value,
  onChange,
  userId,
  allowNone = true,
  noneLabel = 'Sem conta',
  showInitialBalance = false,
}: Props) {
  const { save } = useEntityMutations<BankAccount>('bank_accounts', toBankAccountRow, userId)
  const [adding, setAdding] = useState(false)
  const [presetId, setPresetId] = useState<string | null>(BRAZIL_BANK_PRESETS[0]?.id ?? null)
  const [customName, setCustomName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('corrente')
  const [initialBalance, setInitialBalance] = useState<Cents>(ZERO)
  const [error, setError] = useState('')

  useEffect(() => {
    if (accounts.length === 0) setAdding(true)
  }, [accounts.length])

  const selectedPreset =
    (presetId ? BRAZIL_BANK_PRESETS.find((p) => p.id === presetId) : undefined) ??
    BRAZIL_BANK_PRESETS[0]

  const pickPreset = (p: BankPreset) => {
    setCustomName((prev) => {
      const prevPreset = presetId ? BRAZIL_BANK_PRESETS.find((x) => x.id === presetId) : undefined
      if (!prev.trim() || (prevPreset && prev === prevPreset.name)) return p.name
      return prev
    })
    setPresetId(p.id)
  }

  const resetAdd = () => {
    setPresetId(BRAZIL_BANK_PRESETS[0]?.id ?? null)
    setCustomName('')
    setAccountType('corrente')
    setInitialBalance(ZERO)
    setError('')
  }

  const createAccount = async () => {
    setError('')
    const name = (customName.trim() || selectedPreset?.name || '').trim()
    if (!name) return setError('Escolha um banco ou informe o nome da conta.')
    if (!userId) return setError('Sessão expirada. Entre novamente.')
    const color = selectedPreset?.color ?? BRAZIL_BANK_PRESETS[0].color
    const id = newId()
    try {
      await save.mutateAsync({
        id,
        name,
        color,
        accountType,
        initialBalance: showInitialBalance ? initialBalance : ZERO,
      })
      onChange(id)
      resetAdd()
      setAdding(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a conta.')
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      <div className={styles.chips}>
        {accounts.map((a) => {
          const vis = accountVisual(a)
          const active = value === a.id
          return (
            <button
              key={a.id}
              type="button"
              className={active ? `${styles.accountChip} ${styles.accountChipActive}` : styles.accountChip}
              style={{ ['--chip-color' as string]: vis.color }}
              onClick={() => onChange(a.id)}
            >
              <BankMark preset={vis} size="sm" />
              <span className={styles.chipName}>{a.name}</span>
            </button>
          )
        })}

        {allowNone && (
          <button
            type="button"
            className={value === null ? `${styles.noneChip} ${styles.noneChipActive}` : styles.noneChip}
            onClick={() => onChange(null)}
          >
            {noneLabel}
          </button>
        )}

        {!adding && (
          <button type="button" className={styles.addChip} onClick={() => setAdding(true)}>
            ＋ Adicionar conta
          </button>
        )}
      </div>

      {adding && (
        <div className={styles.addPanel}>
          <BankPresetPicker selectedId={presetId} onSelect={pickPreset} />
          <TextField
            label="Nome da conta"
            name="acc-custom-name"
            placeholder="Ex.: Nubank — corrente"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          {showInitialBalance && (
            <>
              <div>
                <span className={styles.subLabel}>Tipo</span>
                <div className={styles.typeRow}>
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={
                        accountType === t.id ? `${styles.typeChip} ${styles.typeChipActive}` : styles.typeChip
                      }
                      onClick={() => setAccountType(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <MoneyField
                label="Saldo atual (inicial)"
                value={initialBalance}
                onChange={setInitialBalance}
              />
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.addActions}>
            {accounts.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  resetAdd()
                  setAdding(false)
                }}
                disabled={save.isPending}
              >
                Cancelar
              </Button>
            )}
            <Button block loading={save.isPending} onClick={() => void createAccount()}>
              Criar conta
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
