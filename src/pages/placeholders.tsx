import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/PageHeader'

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, padding: '8px 0' }}>
          🚧 Esta tela entra numa próxima fatia da Fase 3 (a navegação e os dados já estão prontos).
        </p>
      </Card>
    </>
  )
}

export const CardsPage = () => <Placeholder title="Cartões" subtitle="Faturas e limites" />
export const InstallmentsPage = () => (
  <Placeholder title="Parcelas" subtitle="Parcelamentos ativos" />
)
