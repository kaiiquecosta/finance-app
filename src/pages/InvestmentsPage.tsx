import { useMemo, useState } from 'react'
import { useAuth } from '@/app/SessionProvider'
import { useFinanceData } from '@/data/hooks'
import { useRates } from '@/data/useMarket'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { HeaderActionButton } from '@/components/legacy/HeaderActionButton'
import { MarketSection } from '@/features/investments/MarketSection'
import { InvestorHub } from '@/features/investments/InvestorHub'
import { InvestmentModal } from '@/features/investments/InvestmentModal'
import { RescueModal } from '@/features/investments/RescueModal'
import { useInvestmentMutations } from '@/features/investments/useInvestmentMutations'
import { formatBRL, sub, sum, ZERO, add as addMoney, type Cents } from '@/domain/money'
import { DEFAULT_RATES, calcInvestment } from '@/domain/calc/investment'
import type { Investment, InvestmentType } from '@/domain/entities'
import styles from './InvestmentsPage.module.css'

type InvView = 'wallet' | 'investor' | 'market'

const TYPE_LABELS: Record<InvestmentType, string> = {
  cdb: 'CDB',
  lci: 'LCI/LCA',
  selic: 'Tesouro Selic',
  ipca: 'Tesouro IPCA+',
  poupanca: 'Poupança',
  acoes: 'Ações BR',
  acoeseua: 'Ações EUA',
  fii: 'FIIs',
  cripto: 'Cripto',
  outro: 'Outro',
}

export function InvestmentsPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useFinanceData(user?.id)
  const rates = useRates()
  const { add, remove, rescue } = useInvestmentMutations(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Investment | null>(null)
  const [rescuing, setRescuing] = useState<Investment | null>(null)
  const [view, setView] = useState<InvView>('wallet')

  const now = useMemo(() => new Date(), [])
  const marketRates = rates.data ? { cdi: rates.data.cdi, ipca: rates.data.ipca } : DEFAULT_RATES

  const rows = useMemo(() => {
    if (!data) return []
    return data.investments.map((inv) => ({
      inv,
      r: calcInvestment(
        {
          amount: inv.amount,
          type: inv.type,
          date: inv.date,
          pct: inv.pct,
          spread: inv.spread,
          yield: inv.yield,
        },
        now,
        marketRates,
      ),
    }))
  }, [data, marketRates, now])

  const distribution = useMemo(() => {
    const map = new Map<InvestmentType, Cents>()
    for (const { inv } of rows) {
      map.set(inv.type, addMoney(map.get(inv.type) ?? ZERO, inv.amount))
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  if (isLoading) return <PageHeader title="Investimentos" subtitle="Carregando…" />
  if (isError || !data) {
    return (
      <>
        <PageHeader title="Investimentos" />
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Não foi possível carregar sua carteira.</p>
        </div>
      </>
    )
  }

  const applied = sum(data.investments.map((i) => i.amount))
  const grossYield = sum(rows.map((x) => x.r.grossYield))
  const netTotal = sum(rows.map((x) => x.r.netAmount))
  const netYield = sub(netTotal, applied)

  return (
    <>
      <PageHeader
        title="Investimentos"
        subtitle="Rendimentos em tempo real"
        action={<HeaderActionButton onClick={() => setModalOpen(true)}>＋ Adicionar</HeaderActionButton>}
      />

      <div className={styles.viewTabs} role="tablist" aria-label="Seções de investimentos">
        {(
          [
            ['wallet', '💼 Minha carteira'],
            ['investor', '📈 Investidor'],
            ['market', '🌐 Mercado ao vivo'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={[styles.viewTab, view === id ? styles.viewTabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'investor' && <InvestorHub onOpenMarket={() => setView('market')} />}

      {view === 'market' && <MarketSection />}

      {view === 'wallet' && (
        <>
      <div className="grid3" style={{ marginBottom: 16 }}>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Total aplicado</div>
          <div className="num-md" style={{ color: 'var(--blue)' }}>
            {formatBRL(applied)}
          </div>
        </div>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Rendimento bruto</div>
          <div className="num-md num-green">{formatBRL(grossYield, { sign: true })}</div>
        </div>
        <div className="card card-sm" style={{ textAlign: 'center' }}>
          <div className="card-label">Rendimento líquido</div>
          <div className="num-md" style={{ color: '#a78bfa' }}>
            {formatBRL(netYield, { sign: true })}
          </div>
        </div>
      </div>

      <div className="cdi-bar fadein">
        <span style={{ fontSize: 16 }}>📡</span>
        <span style={{ color: 'var(--muted)' }}>CDI anual:</span>
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontFamily: 'var(--num)' }}>
          {rates.isLoading
            ? 'carregando…'
            : `${((marketRates.cdi ?? DEFAULT_RATES.cdi) * 100).toFixed(2).replace('.', ',')}%`}
        </span>
        {rates.dataUpdatedAt > 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 'auto' }}>
            {new Date(rates.dataUpdatedAt).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {distribution.length > 1 && (
        <div className="card fadein" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <span className="icon">🥧</span> Distribuição por tipo
          </div>
          {distribution.map(([type, amt]) => {
            const pct = applied > 0 ? (amt / applied) * 100 : 0
            return (
              <div key={type} className="cat-row">
                <span className="cat-name">{TYPE_LABELS[type]}</span>
                <div className="cat-bar-wrap">
                  <div className="prog">
                    <div className="prog-fill" style={{ width: `${pct}%`, background: 'var(--blue)' }} />
                  </div>
                </div>
                <span className="cat-amt">{formatBRL(amt)}</span>
              </div>
            )
          })}
        </div>
      )}

      {data.investments.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Nenhum investimento ainda. Clique em <b>＋ Adicionar</b> e acompanhe o rendimento com as taxas reais
            do mercado.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(({ inv, r }) => (
            <div key={inv.id} className="card fadein">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div className="tx-info" style={{ flex: 1, minWidth: 180 }}>
                  <div className="tx-name" style={{ fontSize: 15, fontWeight: 700 }}>
                    {inv.name}
                  </div>
                  <div className="tx-meta">
                    {TYPE_LABELS[inv.type]}
                    {inv.bank ? ` · ${inv.bank}` : ''} · {r.days}d
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num-md">{formatBRL(r.netAmount)}</div>
                  <div style={{ color: r.netYield >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--num)', fontSize: 13 }}>
                    {formatBRL(r.netYield, { sign: true })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="ghost" onClick={() => setRescuing(inv)}>
                    Resgatar
                  </Button>
                  <button
                    type="button"
                    title="Excluir sem resgatar"
                    onClick={() => setConfirmDelete(inv)}
                    style={{ opacity: 0.65, fontSize: 16, background: 'none', border: 'none' }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>
            Rendimento estimado (juros compostos) com IR simplificado. Valores de renda variável usam a rentabilidade
            estimada informada.
          </p>
        </div>
      )}
        </>
      )}

      <InvestmentModal
        open={modalOpen}
        accounts={data.bankAccounts}
        userId={user?.id}
        saving={add.isPending}
        onClose={() => setModalOpen(false)}
        onSave={async (draft) => {
          await add.mutateAsync(draft)
          setModalOpen(false)
        }}
      />

      <RescueModal
        open={rescuing !== null}
        investment={rescuing}
        accounts={data.bankAccounts}
        userId={user?.id}
        rates={marketRates}
        saving={rescue.isPending}
        onClose={() => setRescuing(null)}
        onConfirm={async ({ amount, accountId }) => {
          if (!rescuing) return
          await rescue.mutateAsync({ investment: rescuing, amount, accountId, rates: marketRates })
          setRescuing(null)
        }}
      />

      <Modal
        open={confirmDelete !== null}
        title="Excluir sem resgatar"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              block
              loading={remove.isPending}
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Excluir <b>{confirmDelete?.name}</b> sem resgatar? Use isto só para corrigir um lançamento errado — nenhum
          valor é creditado em conta. Para sacar o dinheiro de verdade, use <b>Resgatar</b>.
        </p>
      </Modal>
    </>
  )
}
