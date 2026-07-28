import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/app/theme'
import styles from './LandingPage.module.css'

const FEATURES = [
  {
    icon: '💸',
    title: 'Transações',
    desc: 'Lance gastos e receitas em segundos, com categorias e ícones automáticos.',
  },
  {
    icon: '💳',
    title: 'Cartões & parcelas',
    desc: 'Fatura por mês, limite disponível e até adiantamento de parcelas.',
  },
  {
    icon: '📈',
    title: 'Investimentos ao vivo',
    desc: 'Carteira com rendimento real (CDI/IPCA) e mercado atualizando na hora.',
  },
  {
    icon: '🎯',
    title: 'Metas',
    desc: 'Defina objetivos com prazo e acompanhe cada depósito no progresso.',
  },
  {
    icon: '🏠',
    title: 'Contas fixas & assinaturas',
    desc: 'Vencimentos, pagamentos e a projeção do que compromete o seu mês.',
  },
  {
    icon: '💰',
    title: 'Rendas recorrentes',
    desc: 'Salário e outras fontes lançados automaticamente todo período.',
  },
]

export function LandingPage() {
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.logoDot} />
          Finance
        </div>
        <div className={styles.navRight}>
          <button className={styles.iconBtn} onClick={toggle} title="Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/entrar" className={styles.navLink}>
            Entrar
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <span className={styles.badge}>✦ Grátis para começar · 30 dias de Pro</span>
        <h1 className={styles.title}>
          Suas finanças, <span className={styles.accent}>finalmente organizadas</span>
        </h1>
        <p className={styles.subtitle}>
          Um app completo de controle financeiro: transações, cartões, investimentos com mercado ao
          vivo, metas e contas — tudo em um lugar, bonito e simples.
        </p>
        <div className={styles.cta}>
          <Link to="/criar-conta">
            <Button>Criar conta grátis</Button>
          </Link>
          <Link to="/entrar">
            <Button variant="ghost">Já tenho conta</Button>
          </Link>
        </div>
        <p className={styles.note}>Sem cartão de crédito para começar · seus dados isolados e seguros</p>
      </section>

      <section className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.feature}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className={styles.finalCta}>
        <h2 className={styles.finalTitle}>Pronto para assumir o controle?</h2>
        <p className={styles.finalSub}>Leva menos de um minuto para começar.</p>
        <Link to="/criar-conta">
          <Button>Criar minha conta</Button>
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>Finance · Controle financeiro pessoal</span>
        <span className={styles.footerMuted}>Feito com ❤️</span>
      </footer>
    </div>
  )
}
