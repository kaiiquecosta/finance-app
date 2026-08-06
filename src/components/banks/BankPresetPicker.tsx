import { useMemo, useState } from 'react'
import { TextField } from '@/components/ui/TextField'
import {
  BRAZIL_BANK_PRESETS,
  bankButtonTextColor,
  filterBankPresets,
  type BankPreset,
} from '@/domain/banks'
import { BankMark } from './BankMark'
import styles from './BankPresetPicker.module.css'

interface Props {
  selectedId?: string | null
  onSelect: (preset: BankPreset) => void
  /** Mostrar campo de busca (padrão: true). */
  searchable?: boolean
}

/** Grade de bancos com cor de marca, símbolo e busca. */
export function BankPresetPicker({ selectedId, onSelect, searchable = true }: Props) {
  const [query, setQuery] = useState('')
  const list = useMemo(
    () => filterBankPresets(query, BRAZIL_BANK_PRESETS),
    [query],
  )

  return (
    <div className={styles.wrap}>
      {searchable && (
        <TextField
          label="Buscar banco"
          name="bank-search"
          placeholder="Ex.: Nubank, Itaú, Caixa…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      )}
      <div className={styles.grid} role="listbox" aria-label="Bancos">
        {list.map((p) => {
          const active = selectedId === p.id
          const fg = bankButtonTextColor(p.color)
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={active}
              className={active ? `${styles.bankBtn} ${styles.bankBtnActive}` : styles.bankBtn}
              style={{
                background: p.color,
                color: fg,
                ['--bank-fg' as string]: fg,
              }}
              onClick={() => onSelect(p)}
            >
              <BankMark preset={p} size="sm" className={styles.bankBtnMark} />
              <span className={styles.bankBtnName}>{p.name}</span>
            </button>
          )
        })}
      </div>
      {list.length === 0 && (
        <p className={styles.empty}>Nenhum banco encontrado. Tente outro termo.</p>
      )}
    </div>
  )
}
