import { LegalLayout } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade" updated="julho de 2026">
      <p>
        Esta política explica como o <strong>Finance</strong> ("app") trata seus dados, em
        conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome e email (via email/senha ou login Google).
        </li>
        <li>
          <strong>Dados financeiros que você insere:</strong> transações, contas, cartões,
          rendas, metas, investimentos e contas fixas.
        </li>
        <li>
          <strong>Pagamento (plano Pro):</strong> processado pela Stripe. Não armazenamos números
          de cartão — eles ficam com a Stripe.
        </li>
        <li>
          <strong>Armazenamento local:</strong> preferência de tema e sessão de login ficam no seu
          navegador (essenciais para o app funcionar).
        </li>
      </ul>

      <h2>2. Como usamos</h2>
      <p>
        Usamos seus dados exclusivamente para operar o app — mostrar seus lançamentos, calcular
        saldos e rendimentos e processar sua assinatura. <strong>Não vendemos</strong> nem
        compartilhamos seus dados para publicidade.
      </p>

      <h2>3. Onde ficam e segurança</h2>
      <p>
        Seus dados ficam no <strong>Supabase</strong> (PostgreSQL). Cada usuário só acessa os
        próprios dados por meio de Row Level Security (RLS). As senhas são gerenciadas com hash pelo
        provedor de autenticação — nunca as vemos.
      </p>

      <h2>4. Terceiros</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — banco de dados e autenticação.
        </li>
        <li>
          <strong>Stripe</strong> — pagamentos da assinatura.
        </li>
        <li>
          <strong>Banco Central e AwesomeAPI</strong> — cotações de mercado (nenhum dado seu é
          enviado a eles; apenas leitura de índices públicos).
        </li>
      </ul>

      <h2>5. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Acessar e corrigir seus dados dentro do app.</li>
        <li>
          <strong>Exportar</strong> todos os seus dados (backup em arquivo).
        </li>
        <li>
          <strong>Excluir</strong> sua conta e todos os dados associados, de forma permanente.
        </li>
      </ul>

      <h2>6. Contato</h2>
      <p>
        Para exercer seus direitos ou tirar dúvidas, fale com o encarregado de dados:{' '}
        <strong>[email de contato]</strong>.
      </p>
    </LegalLayout>
  )
}
