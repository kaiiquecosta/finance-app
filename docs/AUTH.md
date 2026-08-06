# Autenticação

O caminho principal de entrada é **sem senha**: a pessoa digita o e-mail, recebe um código de
6 dígitos e digita esse código. Login com Google segue disponível. O login por senha continua
existindo, mas atrás de um link discreto ("Entrar com senha").

## ⚠️ Passo obrigatório no painel do Supabase

**Sem isto o fluxo não funciona.** Por padrão, `supabase.auth.signInWithOtp({ email })` envia um
**link mágico** (assunto em inglês “Your Magic Link”, botão “Log In”), **não** o código de 6
dígitos. A tela do app pede para **digitar** o código — se o e-mail só traz link, a experiência
quebra.

Para o e-mail trazer o código:

1. Supabase → **Authentication** → **Emails** (ou _Email Templates_)
2. Abra o template **Magic Link**
3. **Substitua** o corpo pelo arquivo pronto no repositório:
   [`supabase/email-templates/magic-link.html`](../supabase/email-templates/magic-link.html)
   (copie e cole no painel)
4. Ajuste o **assunto** para algo como: `Seu código de acesso ao Flux`
5. Confirme que o corpo inclui `{{ .Token }}` — é a variável que renderiza os 6 dígitos

Exemplo mínimo (se preferir editar manualmente):

```html
<h2>Seu código de acesso ao Flux</h2>
<p>Use este código para entrar:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px">{{ .Token }}</p>
<p>Se você não pediu este código, ignore este e-mail.</p>
```

> Dá para manter o link (`{{ .ConfirmationURL }}`) junto do código no mesmo e-mail. Os dois
> funcionam. Mas no app **nativo** o link tende a confundir: o código digitado dentro do app não
> precisa de ida e volta pelo navegador, então o mais previsível é enviar só o código.

## ⚠️ Desenvolvimento no localhost vs site na Vercel

O app **não** redireciona sozinho para a Vercel depois do login. O que acontece na prática:

| Como você entra | Onde você cai |
| ----------------- | ---------------- |
| **Digita o código** na mesma aba do `localhost` | Continua no **localhost** — é assim que você vê alterações locais |
| **Clica no link** do e-mail | Vai para a URL de retorno configurada no Supabase — muitas vezes a **Site URL** de produção (`*.vercel.app`) se o localhost não estiver liberado |

Para testar mudanças locais:

1. Peça o código com o app em `http://localhost:5173` (ou a porta do Vite).
2. **Digite os 6 dígitos** na tela “Digite o código” — **não** use o link do e-mail enquanto estiver desenvolvendo.
3. No Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: URL de produção (ex.: `https://finance-app-one-weld.vercel.app`)
   - **Redirect URLs**: inclua **também** `http://localhost:5173/**` (e outras portas se usar)

Sem o localhost na lista de Redirect URLs, o link do e-mail abre o site publicado — por isso parece
que “depois de logar vai para a Vercel”, mesmo tendo começado no localhost.

## ⚠️ SMTP: o padrão do Supabase não serve para produção

O servidor de e-mail embutido do Supabase existe para desenvolvimento e tem **limite de envio
baixo por hora**, compartilhado no projeto. Estourado o limite, ninguém recebe código — e, num
fluxo só de código, isso significa **ninguém entra, inclusive quem administra o app**.

Antes de tratar o login por código como o único caminho:

- Configure **SMTP próprio** em Authentication → Settings → SMTP (Resend, SendGrid, SES, Postmark…)
- Confira o rate limit em Authentication → **Rate Limits**
- Confira a validade do código (`OTP expiry`) em Authentication → Settings

Confirme os números atuais no painel: a Supabase já mudou esses limites algumas vezes, e o valor
que vale é o que está lá, não o que está escrito aqui.

## Por que a senha continua existindo

Entrega de e-mail é ponto único de falha: caixa de spam, atraso do provedor, limite de envio
estourado. Enquanto o SMTP próprio não estiver configurado e testado, remover a senha por completo
cria um cenário em que uma falha de e-mail tranca todos os usuários fora das próprias contas.

O link "Entrar com senha" é discreto de propósito — quem não precisa não o nota, e a tela continua
sendo a de código. Para removê-lo depois, é apagar o botão em `AuthScreen.tsx` (passo `login`) e os
passos `password`/`forgot`/`sent`.

**Quem já tem conta com senha não perde acesso:** o código por e-mail entra na mesma conta, porque
o vínculo é o endereço de e-mail. Nada precisa ser migrado.

## Fluxos no código

| Fluxo | Função em `src/data/auth.ts` |
| --------------------------- | ---------------------------------------- |
| Enviar código | `sendEmailCode(email, fullName?)` |
| Conferir código | `verifyEmailCode(email, token)` |
| Google (web e nativo) | `signInWithGoogle()` |
| Senha (saída de emergência) | `signInWithEmail(email, password)` |
| Recuperar senha | `sendPasswordReset(email)` |
| Definir nova senha | `updatePassword(novaSenha)` |

Depois de `verifyEmailCode`, `onAuthStateChange` (em `useSession`) troca a tela sozinho — a tela de
auth não navega manualmente.

### Conta nova entra pelo mesmo caminho

`signInWithOtp` cria o usuário quando o e-mail não existe (`shouldCreateUser` é `true` por padrão).
Por isso login e cadastro são o mesmo fluxo: a diferença entre `/entrar` e `/criar-conta` é só a
copy e o campo de nome.

Consequência a ter em mente: **um e-mail digitado errado cria uma conta vazia** em vez de dar
"usuário não encontrado". Se isso virar problema (contas órfãs no banco), passe
`shouldCreateUser: false` em `sendEmailCode` e trate o erro no passo `login`, mandando a pessoa
para `/criar-conta`.

### `full_name`

Vai em `options.data` e o Supabase **só aplica na criação do usuário** — em logins seguintes é
ignorado. Hoje nada no app lê esse campo (`grep user_metadata` em `src/` não retorna nada), então
ele está guardado para uso futuro.

### App nativo (Capacitor)

O código digitado **não** precisa de deep link: a pessoa digita dentro do app e a sessão abre ali.
O deep link `com.finance.app://login-callback` (tratado em `src/app/nativeAuth.ts`) continua sendo
necessário só para o **Google** e para o link de **reset de senha**.
