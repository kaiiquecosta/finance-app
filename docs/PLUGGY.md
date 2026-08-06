# Integração Pluggy / Open Finance

Stack do **Flux**: React + Vite + Capacitor, **Supabase** (Postgres + RLS + Edge Functions).  
Credenciais Pluggy ficam **somente no servidor** (`PLUGGY_CLIENT_ID` / `PLUGGY_CLIENT_SECRET`).

Documentação oficial: [https://docs.pluggy.ai](https://docs.pluggy.ai)

---

## Visão da arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│  UI (futuro: Configurações → Open Finance)                       │
│       useOpenFinance.ts / getFinancialDataProvider()             │
└────────────────────────────┬────────────────────────────────────┘
                             │ FinancialDataProvider (adapter)
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   manualProvider      ofxProvider (stub)   pluggyProvider
         │                                       │
         │                                       ▼
         │                          Supabase Edge Functions
         │                          pluggy-register-item
         │                          pluggy-sync
         │                          pluggy-connect-token
         │                                       │
         └───────────────────┬───────────────────┘
                             ▼
                    Supabase Postgres (RLS)
   financial_connections | financial_external_accounts | transaction_imports
                             +
                    transactions (lançamentos do app)
```

**Domínio puro:** `src/domain/openFinance/` — tipos, `FinancialDataProvider`, mapeamento Pluggy→categoria/Cents.  
**I/O:** `src/data/openFinance/` — factories e hooks React Query.  
**Servidor:** `supabase/functions/_shared/pluggyClient.ts` + funções dedicadas.

---

## Modelo de dados (Postgres)

| Tabela | Papel |
|--------|--------|
| `financial_connections` | Item Pluggy vinculado ao usuário (`pluggy_item_id`), modo (`personal` / `sandbox` / `commercial`), status |
| `financial_external_accounts` | Contas retornadas pela Pluggy (`BANK`, `CREDIT`), saldo, limite; opcional `bank_account_id` → `bank_accounts` |
| `transaction_imports` | Dedup: `external_id` Pluggy → `transactions.id` |
| `transactions` | Lançamentos já usados pelo app (Visão geral, categorias, etc.) |
| `bank_accounts` | Contas manuais do Flux (podem ser ligadas às externas depois) |
| `cards` / `card_bills` | Cartões **manuais** hoje; faturas Open Finance entram primeiro como `transactions` + metadados em `financial_external_accounts` (`account_kind = CREDIT`) |

Migration: `supabase/migrations/0005_open_finance_pluggy.sql`

---

## FASE 1 — Meu Pluggy (gratuito, uso pessoal)

### Passo a passo

1. **Criar conta** em [https://meu.pluggy.ai](https://meu.pluggy.ai) e conectar seus bancos (Open Finance).
2. No **Dashboard de desenvolvedor** Pluggy, crie uma aplicação de **Development** e copie `CLIENT_ID` e `CLIENT_SECRET`.
3. Vincule cada banco do Meu Pluggy ao app de dev (fluxo OAuth Meu Pluggy no demo Pluggy — uma vez por instituição).
4. Anote o **Item ID** (UUID) de cada conexão (API `GET /items` ou painel).
5. Configure secrets no Supabase (nunca no Vite):

```bash
supabase secrets set PLUGGY_CLIENT_ID=seu_client_id
supabase secrets set PLUGGY_CLIENT_SECRET=seu_client_secret
# opcional
supabase secrets set PLUGGY_API_BASE=https://api.pluggy.ai
```

6. Aplique a migration (`supabase db push` ou SQL Editor).
7. Deploy das Edge Functions:

```bash
supabase functions deploy pluggy-register-item
supabase functions deploy pluggy-sync
supabase functions deploy pluggy-connect-token
```

8. No `.env.local` do frontend:

```env
VITE_OPEN_FINANCE_MODE=personal
# Quando publicar na loja e cobrar Premium:
# VITE_OPEN_FINANCE_PRO_ONLY=true
```

### Registrar Item e sincronizar (API)

Com JWT do usuário logado (`Authorization: Bearer …`):

**POST** `pluggy-register-item`

```json
{ "pluggyItemId": "uuid-do-item", "mode": "personal" }
```

**POST** `pluggy-sync`

```json
{ "dateFrom": "2025-12-01", "dateTo": "2026-03-06" }
```

Resposta exemplo:

```json
{
  "ok": true,
  "accountsSynced": 3,
  "transactionsImported": 412,
  "transactionsSkipped": 0,
  "dateFrom": "2025-12-01"
}
```

No app (React):

```ts
import { useRegisterPluggyItem, useSyncOpenFinance } from '@/data/openFinance/useOpenFinance'

const register = useRegisterPluggyItem(userId)
const sync = useSyncOpenFinance(userId)

await register.mutateAsync({ pluggyItemId: '...', mode: 'personal' })
await sync.mutateAsync({ dateFrom: '2025-12-01' })
```

---

## FASE 2 — Pluggy Connect (Sandbox / Produção / Freemium)

| Plano | Comportamento sugerido |
|-------|-------------------------|
| **Free** | Manual + import OFX/PDF (stub `ofxProvider`); `VITE_OPEN_FINANCE_MODE=off` |
| **Pro / Trial** | `sandbox` ou `commercial` + widget Connect |

1. **POST** `pluggy-connect-token` → `accessToken` (30 min).
2. Abrir [Pluggy Connect Widget](https://docs.pluggy.ai/docs/pluggy-connect-introduction) no app com esse token.
3. Após o usuário conectar, receber `itemId` (callback) e chamar `pluggy-register-item` com `mode: "commercial"`.
4. Webhooks (`transactions/created`, etc.) — recomendado antes de escala; ver [docs Pluggy](https://docs.pluggy.ai/docs/transactions).

Flags:

- `VITE_OPEN_FINANCE_MODE=sandbox|commercial`
- `VITE_OPEN_FINANCE_PRO_ONLY=true` → bloqueia modos pagos no cliente; Edge Function também valida Pro em `commercial`.

---

## Camada `FinancialDataProvider`

Interface: `src/domain/openFinance/provider.ts`

| Implementação | Arquivo | Quando usar |
|---------------|---------|-------------|
| `ManualFinancialProvider` | `manualProvider.ts` | Default / Free |
| `OfxFinancialProvider` | `ofxProvider.ts` | Importação arquivo (a implementar) |
| `PluggyFinancialProvider` | `pluggyProvider.ts` | Meu Pluggy / Connect |

Factory: `getFinancialDataProvider(plan)` em `providerRegistry.ts`.

---

## Mapeamento de transações

- **Valor:** DEBIT → negativo (gasto), CREDIT → positivo (receita), alinhado a `Transaction.amt` (`Cents`).
- **Categoria:** heurística em `mapPluggyCategoryToSlug` — evoluir para árvore Pluggy + regras do usuário.
- **Dedup:** `transaction_imports (user_id, provider, external_id)`.

Testes: `src/domain/openFinance/mapPluggy.test.ts`

---

## Segurança

- `CLIENT_SECRET` **apenas** em Supabase Secrets / Edge Functions.
- Frontend usa `supabase.functions.invoke` com sessão do usuário.
- RLS: usuário só vê/edita suas conexões e importações.
- Open Finance comercial para terceiros exige consentimento via Connect + política de privacidade na Play/App Store.

---

## Próximos passos sugeridos (produto)

1. Tela **Configurações → Open Finance** (registrar Item ID + botão Sincronizar).
2. Vínculo UI: `financial_external_accounts.bank_account_id` ↔ contas manuais.
3. Cartão de crédito OF: criar/atualizar `cards` a partir de contas `CREDIT` + limite em `credit_limit`.
4. Webhooks Pluggy + job agendado (`pluggy-sync` diário).
5. Parser OFX no `ofxProvider` para plano Free.

---

## Referências rápidas Pluggy API

| Ação | Método |
|------|--------|
| Auth (API Key) | `POST /auth` `{ clientId, clientSecret }` |
| Contas | `GET /accounts?itemId=` |
| Transações | `GET /transactions?accountId=&dateFrom=&pageSize=500` |
| Connect Token | `POST /connect_token` |

Implementação: `supabase/functions/_shared/pluggyClient.ts`
