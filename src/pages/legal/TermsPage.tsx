import { LegalLayout } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso" updated="julho de 2026">
      <p>
        Ao criar uma conta e usar o <strong>Flux</strong>, você concorda com estes termos. Leia com
        atenção.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Flux é uma ferramenta de organização financeira pessoal. Os cálculos de rendimento,
        projeções e estimativas de imposto são <strong>informativos e simplificados</strong>, não
        constituindo aconselhamento financeiro, tributário ou de investimento.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Você é responsável por manter a senha em segurança.</li>
        <li>Os dados que você insere são de sua responsabilidade.</li>
        <li>Não use o app para fins ilícitos.</li>
      </ul>

      <h2>3. Plano Pro e pagamentos</h2>
      <p>
        O plano Pro é uma assinatura recorrente cobrada pela Stripe. Você pode cancelar a qualquer
        momento pelo portal de gerenciamento — o acesso permanece até o fim do período já pago.
        Novos cadastros têm um período de teste gratuito.
      </p>

      <h2>4. Disponibilidade</h2>
      <p>
        Nos esforçamos para manter o app disponível, mas ele é fornecido "como está", sem garantia
        de funcionamento ininterrupto. Cotações de mercado vêm de fontes públicas de terceiros e
        podem ter atraso ou indisponibilidade.
      </p>

      <h2>5. Limitação de responsabilidade</h2>
      <p>
        Decisões financeiras tomadas com base nas informações do app são de sua exclusiva
        responsabilidade. Não nos responsabilizamos por perdas decorrentes do uso da ferramenta.
      </p>

      <h2>6. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento. Podemos suspender contas que violem estes
        termos.
      </p>

      <h2>7. Contato</h2>
      <p>
        Dúvidas sobre estes termos:{' '}
        <a href="mailto:fluxcompanyco@gmail.com">fluxcompanyco@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
