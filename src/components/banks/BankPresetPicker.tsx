import { useEffect, useMemo, useState } from 'react'
import { TextField } from '@/components/ui/TextField'
import { filterBankPresets, type BankPreset } from '@/domain/banks'
import { BankMark } from './BankMark'
import styles from './BankPresetPicker.module.css'

interface Props {
  selectedId?: string | null
  onSelect: (preset: BankPreset) => void
  /** Mostrar campo de busca (padrão: true). */
  searchable?: boolean
  /** Troca a instância (ex.: ao reabrir modal) e limpa a busca. */
  resetKey?: string | number
}

/** Grade de bancos com cor de marca, logo e busca global. */
export function BankPresetPicker({ selectedId, onSelect, searchable = true, resetKey }: Props) {
  const [query, setQuery] = useState('')
  const list = useMemo(() => filterBankPresets(query), [query])
  const searching = query.trim().length > 0

  useEffect(() => {
    setQuery('')
  }, [resetKey])

  return (
    <div className={styles.wrap}>
      {searchable && (
        <>
          <TextField
            label="Buscar banco"
            name="bank-search"
            placeholder="Ex.: Nubank, Itaú, BB, Caixa, Bradesco…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {!searching && (
            <p className={styles.searchHint}>
              Os bancos mais usados no Brasil aparecem abaixo. Na busca, digite qualquer nome — inclusive
              American Express, Mercantil, Chase e outros.
            </p>
          )}
        </>
      )}
      <div className={styles.grid} role="listbox" aria-label="Bancos">
        {list.map((p) => {
          const active = selectedId === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={active}
              className={active ? `${styles.bankBtn} ${styles.bankBtnActive}` : styles.bankBtn}
              style={{ ['--bank-color' as string]: p.color }}
              onClick={() => onSelect(p)}
            >
              <BankMark preset={p} size="sm" className={styles.bankBtnMark} />
              <span className={styles.bankBtnName}>{p.name}</span>
            </button>
          )
        })}
      </div>
      {list.length === 0 && (
        <p className={styles.empty}>Nenhum banco encontrado. Tente outro termo ou nome internacional.</p>
      )}
    </div>
  )
}
