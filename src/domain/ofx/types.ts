/** Transação bruta extraída de um arquivo OFX. */
export interface OfxTransaction {
  fitId: string
  trnType: string
  date: string
  /** Valor com sinal, como veio no OFX. */
  amount: number
  memo: string
  name: string
}

export type OfxAccountKind = 'credit' | 'bank' | 'unknown'

export interface OfxSkippedTransaction {
  transaction: OfxTransaction
  reason: string
}

/** Resultado do parse — apenas compras de cartão de crédito ficam em `purchases`. */
export interface OfxParseResult {
  accountKind: OfxAccountKind
  accountId: string
  purchases: OfxTransaction[]
  skipped: OfxSkippedTransaction[]
}
