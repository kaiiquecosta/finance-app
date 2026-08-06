import { describe, expect, it } from 'vitest'
import { addMonthsToISODate } from '@/domain/dates'

describe('addMonthsToISODate', () => {
  it('soma meses sem estourar dia 31', () => {
    expect(addMonthsToISODate('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsToISODate('2024-01-31', 1)).toBe('2024-02-29')
  })
})
