import { describe, expect, it } from 'vitest'
import { nextMonthWindow } from '@/features/overview/upcomingBillsLogic'

describe('nextMonthWindow', () => {
  it('retorna apenas o mês seguinte', () => {
    const w = nextMonthWindow(new Date(2026, 7, 6)) // ago 2026
    expect(w.month).toBe(8) // setembro
    expect(w.year).toBe(2026)
    expect(w.label.toLowerCase()).toContain('setembro')
  })
})
