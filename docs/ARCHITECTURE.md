# Arquitetura

## Princípios

1. **Domínio puro e testado.** Toda a matemática financeira vive em `src/domain/`, sem
   dependência de React/DOM/rede, coberta por testes. Se um cálculo muda, um teste quebra.
2. **Dinheiro em centavos inteiros.** Nada de `float` para valores monetários — ver
   `src/domain/money`. Formatação para BRL só na borda (UI).
3. **Supabase é a fonte da verdade.** O estado do servidor é gerenciado por TanStack Query
   (cache + sync), não por arrays globais mutáveis.
4. **Segurança por RLS, não por obscuridade.** Chaves `anon`/publishable são públicas; o
   isolamento de dados é garantido por Row Level Security no banco. Segredos (Stripe secret,
   webhook) só existem no servidor (Edge Functions).
5. **Um código, várias plataformas.** A mesma SPA roda na web e é empacotada por Capacitor
   para Android/iOS.

## Estrutura de pastas

```
src/
├─ app/         Shell da aplicação: providers, router, layout
├─ pages/       Páginas de rota (marketing + app logado)
├─ features/    Módulos por funcionalidade (transactions, cards, investments, ...)
│               cada um com components/ hooks/ api/ types
├─ domain/      🧮 Lógica de negócio PURA + Money + cálculos (100% testada)
├─ data/        Cliente Supabase, hooks de query/mutation, tipos do schema
├─ components/  UI compartilhada (Card, ListItem, Modal, ProgressBar, ...)
├─ lib/         Utilitários (formatação, datas, categorias)
├─ styles/      Tokens de design, tema dark/light, estilos globais
└─ types/       Tipos globais

supabase/
├─ migrations/  SQL versionado (schema + RLS, inclui tabela `plans`)
└─ functions/   Edge Functions (stripe-checkout, stripe-webhook, stripe-portal, market-data)

e2e/            Testes Playwright
docs/           Documentação (incl. PLUGGY.md — Open Finance)
legacy/         Monólito original (referência de paridade — removido ao final)
```

## Camadas e dependências

```
UI (pages/features/components)  ──►  data (TanStack Query + Supabase)  ──►  Supabase
        │                                                                      ▲
        └──────────────►  domain (puro, sem I/O)  ◄───────────────────────────┘
```

- `domain/` **não importa** nada de `data/`, `app/` ou React.
- `features/` compõem `domain/` (cálculo) + `data/` (I/O) + `components/` (UI).

## Convenções

- Alias de import: `@/` → `src/`.
- Componentes em PascalCase; hooks `useX`; arquivos de teste `*.test.ts(x)`.
- Estilos por CSS Modules (`*.module.css`) usando os tokens de `styles/tokens.css`.
- **Cores 60-30-10:** ~60% `--bg`, ~30% `--card`/`--card2`, ~10% `--primary` (botões,
  links, seleção). Chips usam `--chip-*`; ver comentário no topo de `tokens.css`.
