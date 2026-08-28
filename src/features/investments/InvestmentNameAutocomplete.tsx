import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { searchFixedIncomeCatalog, type FixedIncomeSuggestion } from '@/data/fixedIncomeCatalog'
import type { InvestmentType } from '@/domain/entities'
import styles from './InvestmentNameAutocomplete.module.css'

interface Props {
  label: string
  investmentType: InvestmentType
  name: string
  query: string
  onQueryChange: (query: string) => void
  onSelect: (suggestion: FixedIncomeSuggestion) => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export function InvestmentNameAutocomplete({
  label,
  investmentType,
  name,
  query,
  onQueryChange,
  onSelect,
  onClear,
  placeholder = 'Ex.: LCI Itaú, CDB Nubank 110%…',
  disabled,
}: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const suggestions = useMemo(
    () => (name.trim() ? [] : searchFixedIncomeCatalog(investmentType, query, 8)),
    [investmentType, query, name],
  )

  useEffect(() => {
    setActive(0)
  }, [suggestions])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showList = open && !name.trim() && suggestions.length > 0 && query.trim().length >= 1

  const pick = (s: FixedIncomeSuggestion) => {
    onSelect(s)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <label className={styles.label} htmlFor={listId}>
        {label}
      </label>
      {name.trim() ? (
        <div className={styles.selected}>
          <span className={styles.selectedText}>
            <strong>{name}</strong>
          </span>
          <button type="button" className={styles.clearBtn} onClick={onClear} aria-label="Trocar produto">
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            id={listId}
            className={styles.input}
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            placeholder={placeholder}
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              onQueryChange(e.target.value)
              setOpen(true)
            }}
            onKeyDown={(e) => {
              if (!showList) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(i + 1, suggestions.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const s = suggestions[active]
                if (s) pick(s)
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
          {showList && (
            <ul id={`${listId}-list`} className={styles.list} role="listbox">
              {suggestions.map((s, i) => (
                <li key={s.name} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={i === active ? `${styles.item} ${styles.itemActive}` : styles.item}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                  >
                    <span className={styles.itemBody}>
                      <span className={styles.itemName}>{s.name}</span>
                      {s.bank && <span className={styles.itemMeta}>{s.bank}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
