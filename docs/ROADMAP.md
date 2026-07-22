# Roadmap da reescrita v2

Migração **incremental** (sem big-bang) do monólito `legacy/index.html` para uma arquitetura
profissional, segura e multiplataforma. O domínio financeiro vem primeiro e coberto por testes,
garantindo que nenhum cálculo mude sem ser detectado. Checkpoint verificável ao fim de cada fase.

| Fase  | Objetivo                                                                                    | Status |
| ----- | ------------------------------------------------------------------------------------------- | ------ |
| **0** | Fundação: Vite + React + TS + tooling, estrutura de pastas, mover monólito p/ `legacy/`     | 🚧     |
| **1** | Camada de domínio: `Money` (centavos), cálculos portados + testes; corrigir bugs conhecidos | ⏳     |
| **2** | Camada de dados: schema/RLS versionados, migrations, hooks TanStack Query, auth completa    | ⏳     |
| **3** | UI: componentes compartilhados, navegação, tema, 8 páginas, 24 modais, landing              | ⏳     |
| **4** | Pagamentos: Edge Functions Stripe (checkout/webhook/portal), tabela `plans`, trial          | ⏳     |
| **5** | Segurança & legitimidade: CSP/headers, RLS audit, LGPD/legal, SEO/PWA, observabilidade      | ⏳     |
| **6** | Multiplataforma: Capacitor Android + iOS (deep links OAuth, ícones, plugins)                | ⏳     |
| **7** | Endurecimento: E2E, paridade vs legacy, performance, remover `legacy/`, produção            | ⏳     |

## Bugs do legado a corrigir (decidido: corrigir com testes)

- **Lembrete de meta nunca dispara** — `checkReminders` lê `goal.deadline`, mas o dado é salvo
  como `dl`.
- **`received` de renda não persiste** — não está no mapeamento de `loadUserData` nem no upsert;
  o estado "recebido" é reconstruído a cada sessão.
- **Drift de schema em `fixed_bills`** — `paid_amt`/`fixed` são lidos mas nunca gravados.

## Dívidas/decisões conhecidas

- **IR de investimentos simplificado** (cripto 15% sem isenção R$35k; ações sem isenção R$20k;
  FII isento). Mantido como estimativa documentada; refinar depois.
- **IDs `bigint` gerados no cliente** (`Date.now()`) no legado → migrar para geração no servidor.
- **Tabela `plans` fora do schema versionado** e sem RLS no repo → versionar na Fase 2/4.
- **Fluxo de reset de senha incompleto** (sem `updateUser` / tela de nova senha) → completar na Fase 2.
