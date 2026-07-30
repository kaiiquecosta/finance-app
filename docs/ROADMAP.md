# Roadmap da reescrita v2

Migração **incremental** (sem big-bang) do monólito `legacy/index.html` para uma arquitetura
profissional, segura e multiplataforma. O domínio financeiro vem primeiro e coberto por testes,
garantindo que nenhum cálculo mude sem ser detectado. Checkpoint verificável ao fim de cada fase.

| Fase  | Objetivo                                                                                    | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------ |
| **0** | Fundação: Vite + React + TS + tooling, estrutura de pastas, mover monólito p/ `legacy/`     | ✅     |
| **1** | Camada de domínio: `Money` (centavos), cálculos portados + testes; corrigir bugs conhecidos | ✅     |
| **2** | Camada de dados: schema/RLS versionados, migrations, hooks TanStack Query, auth completa    | ✅     |
| **3** | UI: componentes compartilhados, navegação, tema, 8 páginas, modais, landing                 | ✅     |
| **4** | Pagamentos: Edge Functions Stripe (checkout/webhook/portal), tabela `plans`, trial          | ✅¹    |
| **5** | Segurança & legitimidade: CSP/headers, RLS audit, LGPD/legal, SEO/PWA, observabilidade      | ✅¹    |
| **6** | Multiplataforma: Capacitor Android + iOS (deep links OAuth, ícones, plugins)                | ✅²    |
| **7** | Endurecimento: E2E, paridade vs legacy, performance, remover `legacy/`, produção            | ⏳     |

¹ Fase 4: código completo; requer deploy das Edge Functions + segredos do Stripe.
Fase 5: código completo (headers, LGPD, legal, PWA); revisão jurídica dos textos e Sentry ficam para antes do lançamento. Ver `supabase/functions/README.md`.
² Fase 6: config e código completos (Capacitor wired, deep link OAuth para login E reset de
senha, ícones/splash do Android já prontos). `ios/` ainda não foi criado (precisa rodar
`npx cap add ios` numa máquina com Node 22+; compilar exige macOS/Xcode). O ambiente desta sessão
tem Node 20.8.1 — o `@capacitor/cli` exige 22+, então `cap sync`/`cap add ios` precisam rodar na
sua máquina. Ver `docs/MOBILE.md`.

## Bugs do legado a corrigir (decidido: corrigir com testes)

- **Lembrete de meta nunca dispara** — `checkReminders` lê `goal.deadline`, mas o dado é salvo
  como `dl`.
- **`received` de renda não persiste** — não está no mapeamento de `loadUserData` nem no upsert;
  o estado "recebido" é reconstruído a cada sessão.
- **Drift de schema em `fixed_bills`** — `paid_amt`/`fixed` são lidos mas nunca gravados. Como
  `fixed` nunca era gravado, o "potencial de investimento" somava contas fixas = 0. Corrigido em
  `overview.fixedBillsTotal` (soma todas). Entidade ganhou `paidAmount`.
- **Bug de fuso em datas** — `new Date("2026-03-10")` (UTC) + `getDate()` local deslocava a fatura
  perto da virada de mês. Corrigido com `dates.parseISODate` (trata como data local de calendário).

## Auditoria de paridade (Fase 7) — 4 lacunas encontradas e fechadas

Antes de considerar a v2 pronta para produção, uma auditoria comparou funcionalidade a
funcionalidade com o legado (não cálculo — esses já tinham testes desde a Fase 1) e achou 4
recursos do produto original ausentes ou decorativos na v2. Todos foram fechados nesta fase:

1. **Lembretes/notificações** — `domain/calc/reminders.computeReminders` existia desde a Fase 1
   mas nenhuma tela o consumia. Agora: `features/reminders/useReminders` (com dispensa persistida
   e podada em localStorage) + `ReminderPopup` no `AppShell`, navegando à página relevante.
2. **Resgate de investimento** — só existia "excluir" (sem creditar nada em conta). Agora:
   `domain/calc/investment.planRescue` (resgate parcial reduz o principal proporcionalmente ao
   valor líquido sacado, igual ao legado) + `RescueModal` + mutation que credita a conta escolhida.
   "Excluir sem resgatar" continua disponível, reformulado para corrigir só lançamentos errados.
3. **Assinatura vinculada ao cartão** — o campo de cartão era decorativo (não gerava fatura nem
   consumia limite). Agora: `useSubscriptionMutations` mantém 1 lançamento `recurring:true` em
   `card_bills` por assinatura (mesmo id da assinatura); `billsForMonth` foi estendido para
   projetar lançamentos recorrentes para todo mês à frente, indefinidamente.
4. **Contas fixas + fatura do cartão unificadas** — a tela de Contas só mostrava `fixedBills`.
   Agora: `domain/calc/cards.upcomingCardInvoices` + `BillsPage` mescla contas fixas com a fatura
   aberta de cada cartão numa lista só, ordenada por dia de vencimento.

**Simplificações conscientes** (documentadas, não são bugs):
- O merge de contas fixas usa só a fatura do **mês atual** por cartão (não 3 meses como o legado)
  — evita confundir com o `paid` de `fixedBills`, que é um único toggle (não por mês/ano).
- A recorrência de assinatura no cartão é **1 linha projetada para frente** (não N linhas por
  mês). Excluir a assinatura remove a cobrança de todos os meses (passados e futuros) da visão —
  simplificação aceitável frente à complexidade de materializar histórico mês a mês.
- Faturas de cartão na tela de Contas são **somente leitura** ("Ver fatura →"); pagamento
  continua sendo feito lançamento a lançamento na página Cartões.

## Dívidas/decisões conhecidas

- **IR de investimentos simplificado** (cripto 15% sem isenção R$35k; ações sem isenção R$20k;
  FII isento). Mantido como estimativa documentada; refinar depois.
- **IDs `bigint` gerados no cliente** (`Date.now()`) no legado → migrar para geração no servidor.
- **Tabela `plans` fora do schema versionado** e sem RLS no repo → versionar na Fase 2/4.
- **Fluxo de reset de senha incompleto** (sem `updateUser` / tela de nova senha) → completar na Fase 2.
- **CVE moderada em `react-router-dom` ^6.26.2** (open redirect via backslash em `<Link>`/
  `useNavigate`; `npm audit`). Corrigir exigiria subir para v7 (major breaking) — baixo risco real
  aqui (não renderizamos links/paths vindos de fora), mas fica registrado para a Fase 7.
