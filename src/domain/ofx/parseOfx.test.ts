import { describe, expect, it } from 'vitest'
import { isCreditCardPurchase, parseOfxCreditPurchases } from './parseOfx'

const CREDIT_OFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<CCSTMTRS>
<CCACCTFROM>
<ACCTID>4829
</CCACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260310120000
<TRNAMT>-187.40
<FITID>buy-1
<MEMO>MERCADO EXTRA
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260305120000
<TRNAMT>1200.00
<FITID>pay-1
<MEMO>PAGAMENTO RECEBIDO
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260312120000
<TRNAMT>-26.90
<FITID>buy-2
<NAME>SPOTIFY PREMIUM
</STMTTRN>
</BANKTRANLIST>
</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`

const BANK_OFX = `OFXHEADER:100
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKACCTFROM>
<ACCTID>12345
</BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260310120000
<TRNAMT>-50.00
<FITID>bank-1
<MEMO>PIX ENVIADO
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`

describe('parseOfxCreditPurchases', () => {
  it('extrai somente compras de cartão de crédito', () => {
    const result = parseOfxCreditPurchases(CREDIT_OFX)
    expect(result.accountKind).toBe('credit')
    expect(result.purchases).toHaveLength(2)
    expect(result.purchases[0].fitId).toBe('buy-1')
    expect(result.purchases[0].date).toBe('2026-03-10')
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].transaction.fitId).toBe('pay-1')
  })

  it('rejeita extrato de conta corrente', () => {
    const result = parseOfxCreditPurchases(BANK_OFX)
    expect(result.accountKind).toBe('bank')
    expect(result.purchases).toHaveLength(0)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].reason).toMatch(/conta corrente/i)
  })
})

describe('isCreditCardPurchase', () => {
  it('ignora pagamentos por tipo e memo', () => {
    expect(
      isCreditCardPurchase({
        fitId: '1',
        trnType: 'CREDIT',
        date: '2026-03-01',
        amount: 500,
        memo: 'PAGAMENTO DE FATURA',
        name: '',
      }),
    ).toBe(false)
  })
})
