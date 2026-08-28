import { describe, expect, it } from 'vitest'
import { assetLogoCandidates, assetLogoDarkTile, assetLogoFallbacks, assetLogoUrl } from './assetLogos'

describe('assetLogoUrl', () => {
  it('usa brapi para ações B3', () => {
    expect(assetLogoUrl({ symbol: 'BBSE3', kind: 'stock', region: 'br' })).toBe(
      'https://icons.brapi.dev/icons/BBSE3.svg',
    )
  })

  it('usa icones-b3 para FIIs', () => {
    expect(assetLogoUrl({ symbol: 'MXRF11', kind: 'fii', region: 'br' })).toContain('icones-b3')
  })

  it('prioriza CompaniesMarketCap para ações EUA', () => {
    expect(assetLogoUrl({ symbol: 'DIS', kind: 'stock', region: 'us' })).toContain('DIS.webp')
  })

  it('usa alias GOOG para GOOGL no CMC', () => {
    expect(assetLogoUrl({ symbol: 'GOOGL', kind: 'stock', region: 'us' })).toContain('GOOG.webp')
  })

  it('usa FMP e brapi como fallback para EUA', () => {
    const fallbacks = assetLogoFallbacks({ symbol: 'DIS', kind: 'stock', region: 'us' })
    expect(fallbacks.some((u) => u.includes('financialmodelingprep'))).toBe(true)
    expect(fallbacks.some((u) => u.includes('brapi'))).toBe(true)
  })

  it('usa ícones de cripto', () => {
    expect(assetLogoUrl({ symbol: 'BTC', kind: 'crypto', region: 'global' })).toContain('/btc.png')
  })

  it('marca Disney e Visa para tile escuro no fallback FMP', () => {
    expect(assetLogoDarkTile('DIS')).toBe(true)
    expect(assetLogoDarkTile('V')).toBe(true)
    expect(assetLogoDarkTile('COST')).toBe(false)
  })

  it('monta cadeia de candidatos sem duplicatas', () => {
    const urls = assetLogoCandidates({ symbol: 'V', kind: 'stock', region: 'us' })
    expect(urls.length).toBeGreaterThanOrEqual(3)
    expect(new Set(urls).size).toBe(urls.length)
  })
})
