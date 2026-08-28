import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { isMarketInvestmentType, type BankAccount, type InvestmentType } from '@/domain/entities'
import type { InvestmentDraft } from './useInvestmentMutations'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import { AssetAutocomplete } from './AssetAutocomplete'
import { InvestmentNameAutocomplete } from './InvestmentNameAutocomplete'
import { UnitPriceField } from './UnitPriceField'
import { fetchHistoricalClose } from '@/data/marketHistorical'
import { supportsFixedIncomeAutocomplete, type FixedIncomeSuggestion } from '@/data/fixedIncomeCatalog'
import type { AssetKind, StockDef } from '@/data/stocksCatalog'
import styles from './InvestmentModal.module.css'

type ExtraField = 'pct' | 'spread' | 'yield' | null

interface TypeDef {
  id: InvestmentType
  label: string
  icon: string
  field: ExtraField
  fieldLabel?: string
  fieldDefault?: number
}

const TYPES: TypeDef[] = [
  { id: 'cdb', label: 'CDB', icon: '🏦', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 100 },
  { id: 'lci', label: 'LCI/LCA', icon: '🌿', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 95 },
  { id: 'selic', label: 'Tesouro Selic', icon: '🏛️', field: 'pct', fieldLabel: '% do CDI', fieldDefault: 100 },
  { id: 'ipca', label: 'Tesouro IPCA+', icon: '📊', field: 'spread', fieldLabel: 'Spread sobre IPCA (% a.a.)', fieldDefault: 6 },
  { id: 'poupanca', label: 'Poupança', icon: '🐷', field: null },
  { id: 'acoes', label: 'Ações BR', icon: '📈', field: null },
  { id: 'acoeseua', label: 'Ações EUA', icon: '🇺🇸', field: null },
  { id: 'fii', label: 'FIIs', icon: '🏢', field: null },
  { id: 'cripto', label: 'Cripto', icon: '₿', field: null },
  { id: 'outro', label: 'Outro', icon: '💼', field: 'yield', fieldLabel: 'Rentabilidade estimada (% a.a.)', fieldDefault: 10 },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (draft: InvestmentDraft) => Promise<void>
  saving?: boolean
  accounts: BankAccount[]
  userId: string | undefined
}

function formatMoney(v: number, currency: 'BRL' | 'USD'): string {
  const locale = currency === 'USD' ? 'en-US' : 'pt-BR'
  const code = currency === 'USD' ? 'USD' : 'BRL'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(v)
}

function quantitySettings(kind: AssetKind): { decimals: number; step: number; min: number } {
  if (kind === 'crypto') return { decimals: 8, step: 0.0001, min: 0.00000001 }
  if (kind === 'stock' || kind === 'fii') return { decimals: 0, step: 1, min: 1 }
  return { decimals: 4, step: 0.01, min: 0.0001 }
}

function unitLabel(kind: AssetKind): string {
  if (kind === 'fii') return 'cota'
  if (kind === 'crypto') return 'unidade'
  return 'ação'
}

export function InvestmentModal({ open, onClose, onSave, saving, accounts, userId }: Props) {
  const [typeId, setTypeId] = useState<InvestmentType>('cdb')
  const [name, setName] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [assetQuery, setAssetQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<StockDef | null>(null)
  const [bank, setBank] = useState('')
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [date, setDate] = useState(toISODate(new Date()))
  const [extra, setExtra] = useState(100)
  const [debitAccountId, setDebitAccountId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState<number | null>(null)
  const [priceTouched, setPriceTouched] = useState(false)
  const [refPrice, setRefPrice] = useState<number | null>(null)
  const [buyTradeDate, setBuyTradeDate] = useState<string | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [error, setError] = useState('')

  const type = TYPES.find((t) => t.id === typeId) ?? TYPES[0]
  const isMarket = isMarketInvestmentType(typeId)
  const useFixedIncomeAutocomplete = !isMarket && supportsFixedIncomeAutocomplete(typeId)
  const qtyConfig = selectedAsset ? quantitySettings(selectedAsset.kind) : { decimals: 0, step: 1, min: 1 }

  useEffect(() => {
    if (!open) return
    setError('')
    setTypeId('cdb')
    setName('')
    setNameQuery('')
    setAssetQuery('')
    setSelectedAsset(null)
    setBank('')
    setAmount(ZERO)
    setDate(toISODate(new Date()))
    setExtra(100)
    setQuantity(1)
    setUnitPrice(null)
    setPriceTouched(false)
    setRefPrice(null)
    setBuyTradeDate(null)
    setDebitAccountId(accounts[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accounts omitido de propósito
  }, [open])

  useEffect(() => {
    if (!open) return
    setDebitAccountId((current) => {
      if (current != null && accounts.some((a) => a.id === current)) return current
      return accounts[0]?.id ?? current
    })
  }, [open, accounts])

  useEffect(() => {
    if (!open || !isMarket || !selectedAsset || !date) {
      setRefPrice(null)
      setBuyTradeDate(null)
      return
    }
    let cancelled = false
    setPriceLoading(true)
    void fetchHistoricalClose(selectedAsset.yahoo, date)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setRefPrice(null)
          setBuyTradeDate(null)
          return
        }
        setRefPrice(result.price)
        setBuyTradeDate(result.tradeDate)
        if (!priceTouched) setUnitPrice(result.price)
      })
      .catch(() => {
        if (cancelled) return
        setRefPrice(null)
        setBuyTradeDate(null)
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isMarket, selectedAsset, date])

  const marketTotal = useMemo(() => {
    if (!unitPrice || quantity <= 0) return ZERO
    return Math.round(quantity * unitPrice * 100) as Cents
  }, [quantity, unitPrice])

  const selectType = (t: TypeDef) => {
    setTypeId(t.id)
    if (t.field && t.fieldDefault != null) setExtra(t.fieldDefault)
    setName('')
    setNameQuery('')
    setAssetQuery('')
    setSelectedAsset(null)
    setQuantity(1)
    setUnitPrice(null)
    setPriceTouched(false)
    setRefPrice(null)
  }

  const pickAsset = (def: StockDef) => {
    setSelectedAsset(def)
    setAssetQuery('')
    setName(`${def.symbol} — ${def.name}`)
    setQuantity(1)
    setUnitPrice(null)
    setPriceTouched(false)
    setRefPrice(null)
  }

  const pickFixedIncome = (s: FixedIncomeSuggestion) => {
    setName(s.name)
    setNameQuery('')
    if (s.bank) setBank(s.bank)
    if (s.pct != null && type.field === 'pct') setExtra(s.pct)
    if (s.spread != null && type.field === 'spread') setExtra(s.spread)
    if (s.yield != null && type.field === 'yield') setExtra(s.yield)
  }

  const submit = async () => {
    setError('')
    if (isMarket) {
      if (!selectedAsset) return setError('Escolha o ativo (ex.: ITUB4).')
      if (quantity <= 0) return setError('Informe a quantidade.')
      if (!unitPrice || unitPrice <= 0) return setError('Informe o preço que você pagou por unidade.')
      if (marketTotal <= 0) return setError('Quantidade × preço deve ser maior que zero.')
      if (!bank.trim()) return setError('Informe a corretora.')
    } else {
      const finalName = name.trim() || nameQuery.trim()
      if (!finalName) return setError('Dê um nome ao investimento.')
      if (amount <= 0) return setError('Informe o valor aplicado.')
    }
    try {
      await onSave({
        name:
          isMarket && selectedAsset
            ? `${selectedAsset.symbol} — ${selectedAsset.name}`
            : (name.trim() || nameQuery.trim()),
        bank: bank.trim(),
        amount: isMarket ? marketTotal : amount,
        date,
        type: typeId,
        pct: type.field === 'pct' ? extra : 0,
        spread: type.field === 'spread' ? extra : 0,
        yield: type.field === 'yield' ? extra : 0,
        ticker: isMarket && selectedAsset ? selectedAsset.yahoo : null,
        buyPrice: isMarket ? unitPrice : null,
        accountId: debitAccountId,
        debitAccountId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  return (
    <Modal
      open={open}
      title="📈 Novo investimento"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button block loading={saving || (isMarket && priceLoading)} onClick={() => void submit()}>
            Aplicar
          </Button>
        </>
      }
    >
      <div>
        <span className={styles.label}>Tipo</span>
        <div className={styles.types}>
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={typeId === t.id ? `${styles.type} ${styles.typeActive}` : styles.type}
              onClick={() => selectType(t)}
            >
              <span aria-hidden>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {isMarket ? (
        <>
          <AssetAutocomplete
            label="Ativo"
            investmentType={typeId}
            value={selectedAsset}
            query={assetQuery}
            onQueryChange={setAssetQuery}
            onSelect={pickAsset}
            onClear={() => {
              setSelectedAsset(null)
              setAssetQuery('')
              setName('')
              setQuantity(1)
              setUnitPrice(null)
              setPriceTouched(false)
            }}
            quantity={selectedAsset ? quantity : undefined}
            onQuantityChange={selectedAsset ? setQuantity : undefined}
            quantityDecimals={qtyConfig.decimals}
            quantityStep={qtyConfig.step}
            quantityMin={qtyConfig.min}
          />

          {selectedAsset && (
            <>
              <UnitPriceField
                label={`Preço pago por ${unitLabel(selectedAsset.kind)}`}
                value={unitPrice}
                currency={selectedAsset.currency}
                disabled={priceLoading && unitPrice == null}
                onChange={(v) => {
                  setPriceTouched(true)
                  setUnitPrice(v)
                }}
              />
              {refPrice != null && priceTouched && unitPrice != null && Math.abs(unitPrice - refPrice) > 0.001 && (
                <p className={styles.priceHint}>
                  Referência na data: {formatMoney(refPrice, selectedAsset.currency)}
                  {buyTradeDate && buyTradeDate !== date
                    ? ` (pregão ${buyTradeDate.split('-').reverse().join('/')})`
                    : ''}
                </p>
              )}
              {priceLoading && unitPrice == null && (
                <p className={styles.priceHint}>Buscando referência de preço na data…</p>
              )}
              <div className={styles.priceBox}>
                <div className={styles.priceRow}>
                  <span>Total investido</span>
                  <strong>{formatMoney(marketTotal / 100, selectedAsset.currency)}</strong>
                </div>
                <p className={styles.priceHint}>
                  {quantity.toLocaleString('pt-BR', { maximumFractionDigits: qtyConfig.decimals })}{' '}
                  {quantity === 1 ? unitLabel(selectedAsset.kind) : `${unitLabel(selectedAsset.kind)}s`} ×{' '}
                  {unitPrice != null ? formatMoney(unitPrice, selectedAsset.currency) : '—'}
                </p>
              </div>
            </>
          )}

          <TextField
            label="Corretora"
            name="inv-bank"
            placeholder="Ex.: XP, Nubank, Binance…"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />

          <TextField
            label="Data da compra"
            name="inv-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </>
      ) : (
        <>
          {useFixedIncomeAutocomplete ? (
            <InvestmentNameAutocomplete
              label="Produto"
              investmentType={typeId}
              name={name}
              query={nameQuery}
              onQueryChange={setNameQuery}
              onSelect={pickFixedIncome}
              onClear={() => {
                setName('')
                setNameQuery('')
              }}
              placeholder={
                typeId === 'lci'
                  ? 'Ex.: LCI Itaú, LCA XP 95%…'
                  : typeId === 'cdb'
                    ? 'Ex.: CDB Nubank 110%…'
                    : 'Digite o nome do produto…'
              }
            />
          ) : (
            <TextField
              label="Nome"
              name="inv-name"
              placeholder="Ex.: CDB Nubank 110%, Tesouro Selic…"
              value={name || nameQuery}
              onChange={(e) => {
                setName('')
                setNameQuery(e.target.value)
              }}
            />
          )}

          <TextField
            label="Instituição / corretora (opcional)"
            name="inv-bank"
            placeholder="Ex.: Nubank, XP…"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />

          <MoneyField label="Valor aplicado" value={amount} onChange={setAmount} />

          {type.field && (
            <TextField
              label={type.fieldLabel}
              name="inv-extra"
              inputMode="decimal"
              value={String(extra)}
              onChange={(e) => setExtra(Number(e.target.value.replace(',', '.')) || 0)}
            />
          )}

          <TextField
            label="Data da aplicação"
            name="inv-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </>
      )}

      <AccountPicker
        label="De qual conta saiu o dinheiro?"
        accounts={accounts}
        value={debitAccountId}
        onChange={setDebitAccountId}
        userId={userId}
      />

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  )
}
