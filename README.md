# 💰 Flux

Controle financeiro pessoal — **web + Android + iOS** a partir de um único código.

> **Reescrita v2 em andamento.** O app original (monólito HTML de ~9.700 linhas) está
> preservado em [`legacy/`](./legacy) como referência de paridade e será removido ao final.

## Stack

| Camada          | Tecnologia                                  |
| --------------- | ------------------------------------------- |
| Frontend        | React 18 + TypeScript (strict) + Vite       |
| Roteamento      | React Router v6                             |
| Estado servidor | TanStack Query                              |
| Estado UI       | Zustand                                     |
| Formulários     | React Hook Form + Zod                       |
| Estilo          | CSS Modules + design tokens (dark/light)    |
| Backend/DB      | Supabase (PostgreSQL, Auth, Edge Functions) |
| Pagamentos      | Stripe (via Edge Functions)                 |
| Testes          | Vitest (unit) + Playwright (E2E)            |
| Mobile          | Capacitor                                   |
| Deploy          | Vercel                                      |

## Começando

```bash
npm install
cp .env.example .env.local   # preencha com suas chaves (públicas)
npm run dev
```

## Scripts

| Comando             | O que faz                          |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (Vite) |
| `npm run build`     | Type-check + build de produção     |
| `npm run preview`   | Serve o build localmente           |
| `npm run typecheck` | Verificação de tipos               |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier                           |
| `npm test`          | Testes unitários (Vitest)          |
| `npm run test:e2e`  | Testes E2E (Playwright)            |

## Mobile (Android/iOS)

```bash
npm run cap:sync        # builda o web e sincroniza com os projetos nativos
npm run android:open    # abre no Android Studio
npm run ios:open        # abre no Xcode (requer macOS)
```

⚠️ Requer **Node 22+** só para o tooling do Capacitor (o site web funciona com Node 20+
normalmente). Veja o guia completo em [docs/MOBILE.md](./docs/MOBILE.md).

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)
- [Mobile (Android/iOS)](./docs/MOBILE.md)
