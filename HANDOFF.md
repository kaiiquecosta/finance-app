# 📌 HANDOFF — continue daqui (inclusive no celular)

Este arquivo resume o estado do projeto para retomar em qualquer dispositivo (ex.: Claude Code
no celular via GitHub). A conversa original roda localmente e não sincroniza — mas todo o
contexto necessário está no repositório (aqui + `docs/ROADMAP.md` + `docs/ARCHITECTURE.md`).

## Onde estamos

Reescrita **v2** do app financeiro (monólito → React + TypeScript + Vite + Supabase + Capacitor).
Branch: `v2-rewrite`. O app antigo está preservado em `legacy/`.

- ✅ **Fase 0 — Fundação**: Vite + React 18 + TS strict, tooling, estrutura, tema (dark/light).
- ✅ **Fase 1 — Domínio**: `src/domain/` com dinheiro em centavos e todos os cálculos
  financeiros portados e testados (**95 testes**). 4 bugs do legado corrigidos.
- ⏭️ **Próxima — Fase 2 — Camada de dados**: schema Supabase + tabela `plans` com RLS,
  migrations, cliente via env, hooks TanStack Query, e **auth completa** (incl. reset de senha).

O roadmap completo das 8 fases está em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Como retomar

```bash
npm install
cp .env.example .env.local   # preencha as chaves públicas (Supabase + Stripe pk)
npm test                     # deve passar 95 testes
npm run dev                  # http://localhost:5173
```

> As chaves em `.env.local` são públicas (anon key do Supabase + publishable key do Stripe).
> Estão como referência em `legacy/index.html` caso precise recuperá-las.

## Continuar pelo celular

1. Este código está no GitHub, branch `v2-rewrite`.
2. No celular, abra o **Claude Code na web** (claude.ai/code) logado na mesma conta e conecte
   o repositório `kaiiquecosta/finance-app`, branch `v2-rewrite` — ele sobe um ambiente na nuvem.
3. Comece pedindo: *"Leia HANDOFF.md e docs/ROADMAP.md e continue a Fase 2."*
