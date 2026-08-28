# Checklist de lançamento — Flux

Marque conforme concluir. Bloqueadores primeiro; itens “should-have” podem sair em hotfix pós-lançamento, mas aumentam risco.

**Branch alvo:** `main` unificada (não lançar só `feat/identidade-visual-legado`).

---

## 🔴 Bloqueadores (não publique sem isto)

### Código e banco

- [ ] Merge `main` ← `feat/identidade-visual-legado` (ou PR equivalente)
- [ ] Migration OFX renomeada para `0007_card_bills_external_id.sql` (não sobrescrever `0005` da main)
- [ ] `npx supabase db push` executado em produção sem erro
- [ ] `npm run test` passando
- [ ] `npm run build` passando

### Supabase Auth

- [ ] SMTP próprio configurado e testado (OTP chega em < 1 min)
- [ ] Template Magic Link com `{{ .Token }}` ([`docs/AUTH.md`](./AUTH.md))
- [ ] Site URL = URL de produção
- [ ] Redirect URLs: produção + `localhost` + `com.finance.app://login-callback`
- [ ] Google OAuth testado (web)

### Stripe / Pro

- [ ] Produto + preço recorrente criados (live)
- [ ] Edge Functions deployadas ([`supabase/functions/README.md`](../supabase/functions/README.md))
- [ ] Webhook Stripe apontando para `stripe-webhook` (eventos de subscription)
- [ ] Checkout live testado ponta a ponta (assinar → PRO no app)
- [ ] Billing Portal testado (cancelar)

### Vercel (web)

- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Production
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] Deploy de `main` ativo na URL pública
- [ ] `/privacidade` e `/termos` acessíveis
- [ ] Login OTP + Google OK em produção

### Legal / LGPD

- [ ] Textos de Termos e Privacidade revisados por advogado *(disclaimer atual: não revisados)*
- [ ] Exportação de dados testada
- [ ] Exclusão de conta testada (Edge Function `delete-account`)

---

## 🟡 Should-have (fortemente recomendado)

### Qualidade

- [ ] QA manual dos 8 módulos (contas, cartões, rendas, metas, investimentos, assinaturas, visão geral, comunidade)
- [ ] Teste PWA no Android (Chrome → Instalar app)
- [ ] Teste em viewport mobile (layout responsivo)
- [ ] Importação OFX testada com extrato real de cartão de crédito

### Observabilidade

- [ ] Sentry (ou equivalente) com `VITE_SENTRY_DSN`
- [ ] Alertas para falha de webhook Stripe
- [ ] Monitorar logs Supabase Auth (rate limit / SMTP)

### CI/CD

- [ ] Workflow GitHub Actions: `lint` + `test` + `build` em PR
- [ ] Branch protection em `main`

### Domínio

- [ ] Domínio customizado (opcional) alinhado no Supabase e Stripe `APP_URL`

---

## 🟢 Google Play Store

### Conta e build

- [ ] Conta Google Play Developer ativa (~US$ 25)
- [ ] Node 22+ na máquina de build
- [ ] Keystore criado e backup seguro (fora do git)
- [ ] `versionCode` / `versionName` definidos em `android/app/build.gradle`
- [ ] Build web com env vars de **produção** (`npm run cap:sync`)
- [ ] AAB release assinado gerado (Android Studio)

### Play Console

- [ ] App criado com ID `com.finance.app`
- [ ] Política de privacidade URL: `https://<seu-dominio>/privacidade`
- [ ] Descrições, ícone 512×512, feature graphic 1024×500
- [ ] Screenshots (phone — mín. 2; tablet se aplicável)
- [ ] Formulário **Data safety** preenchido ([`PrivacyPage`](../src/pages/legal/PrivacyPage.tsx))
- [ ] Classificação de conteúdo (questionário IARC)
- [ ] Países/regiões de distribuição selecionados

### Testes na loja

- [ ] **Internal testing** — instalado via link da Play Store
- [ ] OTP por e-mail no app nativo
- [ ] Login Google (abre navegador do sistema → deep link de volta)
- [ ] Assinatura Pro via Stripe no app
- [ ] Sem crashes em cold start e após background

### Publicação

- [ ] Closed testing *(opcional)*
- [ ] Production com rollout gradual (ex.: 20%)
- [ ] Página da loja revisada (ortografia, links)

---

## 📋 Pós-lançamento (primeira semana)

- [ ] Monitorar reviews na Play Store
- [ ] Monitorar webhooks Stripe (eventos falhos)
- [ ] Monitorar taxa de entrega de e-mail OTP
- [ ] Plano de hotfix: branch → PR → merge → Vercel + novo AAB se necessário
- [ ] Documentar `versionCode` publicado e notas da release

---

## Referências rápidas

| Documento | Conteúdo |
| --------- | -------- |
| [`docs/DEPLOY.md`](./DEPLOY.md) | Passo a passo completo web + Play |
| [`docs/MOBILE.md`](./MOBILE.md) | Capacitor, OAuth nativo, Node 22 |
| [`docs/AUTH.md`](./AUTH.md) | SMTP, OTP, redirect URLs |
| [`supabase/README.md`](../supabase/README.md) | Migrations e schema |
| [`supabase/functions/README.md`](../supabase/functions/README.md) | Stripe Edge Functions |
