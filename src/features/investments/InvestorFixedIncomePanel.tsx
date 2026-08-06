import { Button } from '@/components/ui/Button'
import { DEFAULT_RATES, type Rates } from '@/data/market'
import styles from './InvestorHub.module.css'

type Props = {
  variant: 'renda_fixa' | 'tesouro'
  rates: Rates | undefined
  loading: boolean
  onOpenMarket?: () => void
}

function pct(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(2).replace('.', ',')}% a.a.`
}

export function InvestorFixedIncomePanel({ variant, rates, loading, onOpenMarket }: Props) {
  const cdi = rates?.cdi ?? DEFAULT_RATES.cdi
  const ipca = rates?.ipca ?? DEFAULT_RATES.ipca
  const selic = rates?.selic ?? DEFAULT_RATES.selic

  const title = variant === 'tesouro' ? 'Tesouro Direto' : 'Renda fixa'
  const intro =
    variant === 'tesouro'
      ? 'Use Selic e IPCA como referência para Tesouro Selic, IPCA+ e prefixados. Lance seus títulos em Minha carteira como investimento.'
      : 'CDB, LCI/LCA e títulos bancários costumam ser comparados ao CDI. Acompanhe taxas oficiais e registre posições na sua carteira.'

  return (
    <div className={styles.fixedIncome}>
      <h3 className={styles.panelTitle}>{title}</h3>
      <p className={styles.panelHint}>{intro}</p>
      <div className={styles.rateGrid}>
        <div className={styles.rateCard}>
          <span className={styles.rateLabel}>CDI (ref.)</span>
          <span className={styles.rateVal}>{loading ? '…' : pct(cdi)}</span>
        </div>
        <div className={styles.rateCard}>
          <span className={styles.rateLabel}>Selic</span>
          <span className={styles.rateVal}>{loading ? '…' : pct(selic)}</span>
        </div>
        <div className={styles.rateCard}>
          <span className={styles.rateLabel}>IPCA 12m</span>
          <span className={styles.rateVal}>{loading ? '…' : pct(ipca)}</span>
        </div>
      </div>
      {onOpenMarket && (
        <Button type="button" variant="ghost" onClick={onOpenMarket}>
          Abrir Mercado ao vivo →
        </Button>
      )}
      <p className={styles.disclaimer}>
        Taxas via BCB / AwesomeAPI. Não substituem simulação oficial do Tesouro ou proposta do banco.
      </p>
    </div>
  )
}
