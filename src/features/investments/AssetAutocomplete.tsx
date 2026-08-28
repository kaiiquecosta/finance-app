import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { searchInvestmentCatalog } from '@/data/investmentCatalog'
import type { StockDef } from '@/data/stocksCatalog'
import type { InvestmentType } from '@/domain/entities'
import styles from './AssetAutocomplete.module.css'

interface Props {
  label: string
  investmentType: InvestmentType
  value: StockDef | null
  query: string
  onQueryChange: (query: string) => void
  onSelect: (asset: StockDef) => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export function AssetAutocomplete({
  label,
  investmentType,
  value,
  query,
  onQueryChange,
  onSelect,
  onClear,
  placeholder = 'Ex.: ITUB4, MXRF11, AAPL…',
  disabled,
}: Props) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const suggestions = useMemo(
    () => (value ? [] : searchInvestmentCatalog(investmentType, query, 8)),
    [investmentType, query, value],
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

  const showList = open && !value && suggestions.length > 0 && query.trim().length >= 1

  const pick = (def: StockDef) => {
    onSelect(def)
    setOpen(false)
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <label className={styles.label} htmlFor={listId}>
        {label}
      </label>
      {value ? (
        <div className={styles.selected}>
          <span className={styles.selectedIcon} aria-hidden>
            {value.icon}
          </span>
          <span className={styles.selectedText}>
            <strong>{value.symbol}</strong>
            <span className={styles.selectedName}>{value.name}</span>
          </span>
          <button type="button" className={styles.clearBtn} onClick={onClear} aria-label="Trocar ativo">
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
                const def = suggestions[active]
                if (def) pick(def)
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
          {showList && (
            <ul id={`${listId}-list`} className={styles.list} role="listbox">
              {suggestions.map((def, i) => (
                <li key={def.yahoo} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={i === active ? `${styles.item} ${styles.itemActive}` : styles.item}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(def)}
                  >
                    <span className={styles.itemIcon} aria-hidden>
                      {def.icon}
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemSymbol}>{def.symbol}</span>
                      <span className={styles.itemName}>{def.name}</span>
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
