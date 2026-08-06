import { useEffect, useRef, useState } from 'react'
import { MONTHS, MONTHS_FULL } from '@/domain/categories'

type Props = {
  month: number
  year: number
  onPrev: () => void
  onNext: () => void
  /** Rótulo central (ex.: "Março de 2026" ou "Fatura de março 2026"). */
  label: string
  hint?: string
  monthOffset: number
  onGoToday?: () => void
  /** Permite abrir seletor mês/ano (cartões). */
  pickable?: boolean
  onPickMonth?: (month: number, year: number) => void
}

export function MonthNav({
  month,
  year,
  onPrev,
  onNext,
  label,
  hint,
  monthOffset,
  onGoToday,
  pickable,
  onPickMonth,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const centerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pickerOpen) setPickerYear(year)
  }, [pickerOpen, year])

  useEffect(() => {
    if (!pickerOpen) return
    const close = (e: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('click', close, { once: true })
    return () => document.removeEventListener('click', close)
  }, [pickerOpen])

  const now = new Date()

  return (
    <div className="month-nav fadein">
      <button type="button" className="month-btn" onClick={onPrev} aria-label="Mês anterior">
        ‹
      </button>
      <div className="month-center" ref={centerRef}>
        <div
          className={['month-lbl', pickable ? 'pickable' : ''].filter(Boolean).join(' ')}
          role={pickable ? 'button' : undefined}
          tabIndex={pickable ? 0 : undefined}
          onClick={() => pickable && setPickerOpen((o) => !o)}
          onKeyDown={(e) => {
            if (pickable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setPickerOpen((o) => !o)
            }
          }}
        >
          {label}
          {pickable && <span style={{ fontSize: 11, color: 'var(--muted)' }}>▾</span>}
        </div>
        {hint && <div className="month-hint">{hint}</div>}
        {pickable && pickerOpen && onPickMonth && (
          <div
            style={{
              display: 'block',
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#16161f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: 16,
              zIndex: 200,
              width: 260,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                type="button"
                className="month-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setPickerYear((y) => y - 1)
                }}
              >
                ‹
              </button>
              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--num)', fontSize: 14 }}>
                {pickerYear}
              </span>
              <button
                type="button"
                className="month-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setPickerYear((y) => y + 1)
                }}
              >
                ›
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {MONTHS.map((mn, mi) => {
                const isActive = mi === month && pickerYear === year
                return (
                  <button
                    key={mn}
                    type="button"
                    style={{
                      padding: '7px 4px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      background: isActive ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isActive ? 'var(--green)' : 'rgba(255,255,255,0.07)'}`,
                      color: isActive ? '#000' : 'var(--muted)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPickMonth(mi, pickerYear)
                      setPickerOpen(false)
                    }}
                  >
                    {mn}
                  </button>
                )
              })}
            </div>
            {pickerYear !== now.getFullYear() && onGoToday && (
              <button
                type="button"
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: 7,
                  borderRadius: 8,
                  background: 'rgba(96,165,250,0.1)',
                  border: '1px solid rgba(96,165,250,0.25)',
                  color: '#60a5fa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onGoToday()
                  setPickerOpen(false)
                }}
              >
                ↩ Voltar para fatura atual
              </button>
            )}
          </div>
        )}
      </div>
      <button type="button" className="month-btn" onClick={onNext} aria-label="Próximo mês">
        ›
      </button>
      {monthOffset !== 0 && onGoToday && (
        <button type="button" className="month-today" onClick={onGoToday}>
          {pickable ? 'atual' : 'hoje'}
        </button>
      )}
    </div>
  )
}

export function monthOffsetFrom(month: number, year: number, asOf = new Date()): number {
  return (year - asOf.getFullYear()) * 12 + (month - asOf.getMonth())
}

export function labelMonthYear(month: number, year: number): string {
  return `${MONTHS_FULL[month]} de ${year}`
}
