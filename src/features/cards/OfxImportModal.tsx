import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatBRL, reais } from '@/domain/money'
import { formatDate } from '@/lib/format'
import { parseOfxCreditPurchases } from '@/domain/ofx/parseOfx'
import { filterDuplicatePurchases, mapPurchasesToCardBills } from '@/domain/ofx/mapToCardBills'
import type { OfxTransaction } from '@/domain/ofx/types'
import type { Card as CardEntity, CardBill } from '@/domain/entities'
import styles from './OfxImportModal.module.css'

interface Props {
  open: boolean
  cards: CardEntity[]
  saving?: boolean
  onClose: () => void
  onSave: (bills: CardBill[]) => Promise<void>
}

export function OfxImportModal({ open, cards, saving, onClose, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cardId, setCardId] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [allPurchases, setAllPurchases] = useState<OfxTransaction[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [bankFile, setBankFile] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [duplicateCount, setDuplicateCount] = useState(0)

  const creditCards = useMemo(() => cards.filter((c) => c.type === 'credito'), [cards])

  const applyForCard = (targetId: number, source: OfxTransaction[]) => {
    const card = creditCards.find((c) => c.id === targetId)
    if (!card) return

    const { fresh, duplicates } = filterDuplicatePurchases(source, card.bills)
    setDuplicateCount(duplicates.length)
    setSelected(new Set(fresh.map((p) => p.fitId)))

    if (fresh.length === 0 && source.length > 0) {
      setError('Todas as compras deste arquivo já existem neste cartão.')
    } else {
      setError('')
    }

    return fresh
  }

  const [visiblePurchases, setVisiblePurchases] = useState<OfxTransaction[]>([])

  useEffect(() => {
    if (!open) return
    setError('')
    setFileName('')
    setAllPurchases([])
    setVisiblePurchases([])
    setSkippedCount(0)
    setBankFile(false)
    setSelected(new Set())
    setDuplicateCount(0)
    const first = creditCards[0]?.id ?? ''
    setCardId(first)
  }, [open, creditCards])

  const toggle = (fitId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(fitId)) next.delete(fitId)
      else next.add(fitId)
      return next
    })
  }

  const onFile = async (file: File | null) => {
    setError('')
    if (!file) return

    const targetId = typeof cardId === 'number' ? cardId : creditCards[0]?.id
    if (!targetId) {
      setError('Cadastre um cartão de crédito antes de importar.')
      return
    }

    try {
      const text = await file.text()
      const parsed = parseOfxCreditPurchases(text)
      setFileName(file.name)
      setBankFile(parsed.accountKind === 'bank')
      setSkippedCount(parsed.skipped.length)
      setAllPurchases(parsed.purchases)

      if (parsed.accountKind === 'bank') {
        setVisiblePurchases([])
        setSelected(new Set())
        setDuplicateCount(0)
        setError('Este arquivo é de conta corrente. Importe apenas extratos OFX de cartão de crédito.')
        return
      }

      if (parsed.purchases.length === 0) {
        setVisiblePurchases([])
        setSelected(new Set())
        setDuplicateCount(0)
        setError('Nenhuma compra de crédito encontrada neste arquivo.')
        return
      }

      const fresh = applyForCard(targetId, parsed.purchases) ?? []
      setVisiblePurchases(fresh)
    } catch {
      setError('Não foi possível ler o arquivo OFX.')
    }
  }

  const onCardChange = (nextId: number) => {
    setCardId(nextId)
    if (allPurchases.length === 0) return
    const fresh = applyForCard(nextId, allPurchases) ?? []
    setVisiblePurchases(fresh)
  }

  const submit = async () => {
    setError('')
    const card = creditCards.find((c) => c.id === cardId)
    if (!card) return setError('Selecione o cartão de destino.')
    if (selected.size === 0) return setError('Selecione ao menos uma compra.')

    const chosen = visiblePurchases.filter((p) => selected.has(p.fitId))
    try {
      await onSave(mapPurchasesToCardBills(card.id, chosen))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível importar.')
    }
  }

  return (
    <Modal
      open={open}
      title="Importar OFX — cartão de crédito"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            block
            loading={saving}
            disabled={bankFile || selected.size === 0}
            onClick={() => void submit()}
          >
            Importar {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </>
      }
    >
      <p className={styles.hint}>
        Apenas extratos de <b>cartão de crédito</b> (.ofx / .qfx). Pagamentos de fatura e lançamentos de
        conta corrente são ignorados.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".ofx,.qfx,application/x-ofx,text/plain"
        className={styles.fileInput}
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
      />

      <Button variant="ghost" block onClick={() => inputRef.current?.click()}>
        {fileName ? `Arquivo: ${fileName}` : 'Escolher arquivo OFX'}
      </Button>

      {creditCards.length > 1 && (
        <label className={styles.field}>
          <span className={styles.label}>Cartão de destino</span>
          <select
            className={styles.select}
            value={cardId}
            onChange={(e) => onCardChange(Number(e.target.value))}
          >
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {skippedCount > 0 && !bankFile && (
        <p className={styles.meta}>{skippedCount} lançamento(s) ignorado(s) (pagamentos/créditos).</p>
      )}
      {duplicateCount > 0 && (
        <p className={styles.meta}>{duplicateCount} compra(s) já importada(s) neste cartão.</p>
      )}

      {visiblePurchases.length > 0 && (
        <div className={styles.list}>
          {visiblePurchases.map((txn) => (
            <label key={txn.fitId} className={styles.row}>
              <input
                type="checkbox"
                checked={selected.has(txn.fitId)}
                onChange={() => toggle(txn.fitId)}
              />
              <div className={styles.rowInfo}>
                <span className={styles.rowDesc}>{txn.memo || txn.name || 'Compra'}</span>
                <span className={styles.rowDate}>{formatDate(txn.date)}</span>
              </div>
              <span className={styles.rowAmt}>{formatBRL(reais(Math.abs(txn.amount)))}</span>
            </label>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
