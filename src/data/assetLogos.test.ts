import { describe, expect, it } from 'vitest'
import { assetLogoUrl } from './assetLogos'

describe('assetLogoUrl', () => {
  it('usa brapi para ações B3', () => {
    expect(assetLogoUrl({ symbol: 'BBSE3', kind: 'stock', region: 'br' })).toBe(
      'https://icons.brapi.dev/icons/BBSE3.svg',
    )
  })

  it('usa icones-b3 para FIIs', () => {
    expect(assetLogoUrl({ symbol: 'MXRF11', kind: 'fii', region: 'br' })).toContain('icones-b3')
  })

  it('usa FMP para ações EUA', () => {
    expect(assetLogoUrl({ symbol: 'NVDA', kind: 'stock', region: 'us' })).toContain('NVDA.png')
  })

  it('usa ícones de cripto', () => {
    expect(assetLogoUrl({ symbol: 'BTC', kind: 'crypto', region: 'global' })).toContain('/btc.png')
  })
})
