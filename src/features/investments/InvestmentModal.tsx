import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { MoneyField } from '@/components/ui/MoneyField'
import { ZERO, toReais, type Cents } from '@/domain/money'
import { toISODate } from '@/domain/dates'
import { isMarketInvestmentType, type BankAccount, type InvestmentType } from '@/domain/entities'
import type { InvestmentDraft } from './useInvestmentMutations'
import { AccountPicker } from '@/components/accounts/AccountPicker'
import { AssetAutocomplete } from './AssetAutocomplete'
import { fetchHistoricalClose, sharesFromAmount } from '@/data/marketHistorical'
import type { StockDef } from '@/data/stocksCatalog'
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

function formatUnitPrice(price: number, currency: 'BRL' | 'USD'): string {
  const locale = currency === 'USD' ? 'en-US' : 'pt-BR'
  const code = currency === 'USD' ? 'USD' : 'BRL'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 4 }).format(price)
}

export function InvestmentModal({ open, onClose, onSave, saving, accounts, userId }: Props) {
  const [typeId, setTypeId] = useState<InvestmentType>('cdb')
  const [name, setName] = useState('')
  const [assetQuery, setAssetQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<StockDef | null>(null)
  const [bank, setBank] = useState('')
  const [amount, setAmount] = useState<Cents>(ZERO)
  const [date, setDate] = useState(toISODate(new Date()))
  const [extra, setExtra] = useState(100)
  const [debitAccountId, setDebitAccountId] = useState<number | null>(null)
  const [buyPrice, setBuyPrice] = useState<number | null>(null)
  const [buyTradeDate, setBuyTradeDate] = useState<string | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [error, setError] = useState('')

  const type = TYPES.find((t) => t.id === typeId) ?? TYPES[0]
  const isMarket = isMarketInvestmentType(typeId)

  useEffect(() => {
    if (!open) return
    setError('')
    setPriceError('')
    setTypeId('cdb')
    setName('')
    setAssetQuery('')
    setSelectedAsset(null)
    setBank('')
    setAmount(ZERO)
    setDate(toISODate(new Date()))
    setExtra(100)
    setBuyPrice(null)
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
      setBuyPrice(null)
      setBuyTradeDate(null)
      setPriceError('')
      return
    }
    let cancelled = false
    setPriceLoading(true)
    setPriceError('')
    void fetchHistoricalClose(selectedAsset.yahoo, date)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setBuyPrice(null)
          setBuyTradeDate(null)
          setPriceError('Não encontramos o preço nessa data. Confira o ticker e a data da compra.')
          return
        }
        setBuyPrice(result.price)
        setBuyTradeDate(result.tradeDate)
      })
      .catch(() => {
        if (cancelled) return
        setBuyPrice(null)
        setBuyTradeDate(null)
        setPriceError('Falha ao buscar preço histórico. Tente de novo.')
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isMarket, selectedAsset, date])

  const shares = useMemo(() => {
    if (!buyPrice || amount <= 0) return null
    return sharesFromAmount(toReais(amount), buyPrice)
  }, [amount, buyPrice])

  const selectType = (t: TypeDef) => {
    setTypeId(t.id)
    if (t.field && t.fieldDefault != null) setExtra(t.fieldDefault)
    if (isMarketInvestmentType(t.id)) {
      setName('')
      setAssetQuery('')
      setSelectedAsset(null)
    } else {
      setSelectedAsset(null)
      setAssetQuery('')
    }
  }

  const pickAsset = (def: StockDef) => {
    setSelectedAsset(def)
    setAssetQuery('')
    setName(`${def.symbol} — ${def.name}`)
  }

  const submit = async () => {
    setError('')
    if (isMarket) {
      if (!selectedAsset) return setError('Escolha o ativo (ex.: ITUB4).')
      if (amount <= 0) return setError('Informe quanto você investiu.')
      if (!bank.trim()) return setError('Informe a corretora.')
      if (!buyPrice) return setError(priceError || 'Aguarde o preço da data ou ajuste a data da compra.')
    } else {
      if (!name.trim()) return setError('Dê um nome ao investimento.')
      if (amount <= 0) return setError('Informe o valor aplicado.')
    }
    try {
      await onSave({
        name: isMarket && selectedAsset ? `${selectedAsset.symbol} — ${selectedAsset.name}` : name.trim(),
        bank: bank.trim(),
        amount,
        date,
        type: typeId,
        pct: type.field === 'pct' ? extra : 0,
        spread: type.field === 'spread' ? extra : 0,
        yield: type.field === 'yield' ? extra : 0,
        ticker: isMarket && selectedAsset ? selectedAsset.yahoo : null,
        buyPrice: isMarket ? buyPrice : null,
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
            }}
          />

          <TextField
            label="Corretora"
            name="inv-bank"
            placeholder="Ex.: XP, Nubank, Binance…"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />

          <MoneyField label="Quanto você investiu?" value={amount} onChange={setAmount} />

          <TextField
            label="Data da compra"
            name="inv-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {selectedAsset && (
            <div className={styles.priceBox}>
              {priceLoading ? (
                <p className={styles.priceHint}>Buscando preço na data…</p>
              ) : buyPrice ? (
                <>
                  <div className={styles.priceRow}>
                    <span>Preço por {selectedAsset.kind === 'fii' ? 'cota' : 'ação'}</span>
                    <strong>{formatUnitPrice(buyPrice, selectedAsset.currency)}</strong>
                  </div>
                  {buyTradeDate && buyTradeDate !== date && (
                    <p className={styles.priceHint}>Último pregão usado: {buyTradeDate.split('-').reverse().join('/')}</p>
                  )}
                  {shares != null && shares > 0 && (
                    <div className={styles.priceRow}>
                      <span>Quantidade estimada</span>
                      <strong>
                        {shares.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}{' '}
                        {selectedAsset.kind === 'fii' ? 'cotas' : selectedAsset.kind === 'crypto' ? 'un.' : 'ações'}
                      </strong>
                    </div>
                  )}
                  <p className={styles.priceHint}>
                    A rentabilidade na carteira usa a cotação atual vs. esse preço de compra.
                  </p>
                </>
              ) : priceError ? (
                <p className={styles.errorInline}>{priceError}</p>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <TextField
            label="Nome"
            name="inv-name"
            placeholder="Ex.: CDB Nubank 110%, Tesouro Selic…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
