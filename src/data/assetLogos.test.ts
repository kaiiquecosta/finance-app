import { describe, expect, it } from 'vitest'
import { assetLogoFallbacks, assetLogoUrl } from './assetLogos'

describe('assetLogoUrl', () => {
  it('usa brapi para ações B3', () => {
    expect(assetLogoUrl({ symbol: 'BBSE3', kind: 'stock', region: 'br' })).toBe(
      'https://icons.brapi.dev/icons/BBSE3.svg',
    )
  })

  it('usa icones-b3 para FIIs', () => {
    expect(assetLogoUrl({ symbol: 'MXRF11', kind: 'fii', region: 'br' })).toContain('icones-b3')
  })

  it('prioriza brapi SVG para ações EUA', () => {
    expect(assetLogoUrl({ symbol: 'NFLX', kind: 'stock', region: 'us' })).toContain('NFLX.svg')
  })

  it('usa FMP como fallback para EUA sem brapi', () => {
    const fallbacks = assetLogoFallbacks({ symbol: 'AMZN', kind: 'stock', region: 'us' })
    expect(fallbacks.some((u) => u.includes('financialmodelingprep'))).toBe(true)
  })

  it('usa ícones de cripto', () => {
    expect(assetLogoUrl({ symbol: 'BTC', kind: 'crypto', region: 'global' })).toContain('/btc.png')
  })
})
