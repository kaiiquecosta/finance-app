# Mobile — Android e iOS (Capacitor)

O app web (React/Vite) é empacotado nativamente com [Capacitor](https://capacitorjs.com):
o `dist/` do build vira o conteúdo de uma WebView dentro de um app Android/iOS de verdade,
com acesso a APIs nativas (navegador do sistema para OAuth, etc.).

## ⚠️ Pré-requisito importante: Node 22+

O **`@capacitor/cli`** exige **Node.js 22 ou superior** para rodar os comandos `cap sync`,
`cap add`, `cap open`, etc. Isso é **só para o tooling de empacotamento mobile** — não afeta o
site web (Vercel/`npm run build` funcionam normalmente com Node 20+).

Verifique sua versão e, se precisar, instale/troque via [nvm](https://github.com/nvm-sh/nvm)
(ou [nvm-windows](https://github.com/coreybutler/nvm-windows)):

```bash
node --version   # precisa ser >= 22
nvm install 22
nvm use 22
```

## Estrutura já pronta

- **`android/`** — projeto Android Studio completo (Gradle), já com ícones, splash screen e o
  deep link de OAuth configurado no `AndroidManifest.xml` (`com.finance.app://login-callback`).
- **`capacitor.config.json`** — aponta `webDir` para `dist` (a saída do `vite build`).
- **`ios/`** — ainda não existe neste repositório; é criado com `npx cap add ios` (precisa de
  **macOS + Xcode** para abrir/compilar depois — não dá para gerar/testar num PC Windows/Linux).

## Fluxo de build

```bash
npm run cap:sync        # builda o web (dist/) e sincroniza com os projetos nativos
npm run android:open    # abre o projeto no Android Studio
npm run ios:open        # abre o projeto no Xcode (requer macOS)
```

`cap:sync` executa `npm run build` e depois `npx cap sync`, que:
1. Copia `dist/` para dentro de `android/app/src/main/assets/public` (e `ios/App/App/public`).
2. Atualiza as dependências nativas (versões dos plugins Capacitor).

## Primeira vez com o Android

```bash
npm run cap:sync
npm run android:open
```

No Android Studio: aguarde o Gradle sincronizar → escolha um emulador ou conecte um celular via
USB (com depuração ativada) → **Run ▶**.

## Primeira vez com o iOS (precisa de um Mac)

```bash
npx cap add ios          # cria a pasta ios/ (só precisa rodar uma vez)
npm run cap:sync
npm run ios:open
```

No Xcode: configure o **Team** (sua conta Apple Developer) em *Signing & Capabilities* → escolha
um simulador ou dispositivo → **Run ▶**.

Depois de criar `ios/`, adicione o URL Scheme para o deep link de OAuth em
`ios/App/App/Info.plist` (dentro de `CFBundleURLTypes`):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.finance.app</string>
    </array>
  </dict>
</array>
```

## Login com Google no app nativo

O fluxo é diferente do navegador:

1. O app abre o navegador do **sistema** (não um WebView) com a URL de login do Google
   (`@capacitor/browser`, `Browser.open`) — necessário porque o Google bloqueia login dentro de
   WebViews embutidas.
2. Depois de autenticar, o Google/Supabase redireciona para `com.finance.app://login-callback`,
   um **deep link** que o Android/iOS entrega de volta ao app (não ao navegador).
3. O app escuta esse retorno (`@capacitor/app`, evento `appUrlOpen`, em `src/app/nativeAuth.ts`),
   extrai o `code` da URL e troca por uma sessão (`supabase.auth.exchangeCodeForSession`).
4. Para o **reset de senha** funcionar corretamente também no nativo, a rota pretendida
   (`/redefinir-senha`) viaja como um parâmetro extra na URL do deep link e é consumida pelo
   `App.tsx` assim que a sessão fica disponível.

Nenhuma configuração adicional é necessária no Supabase além da já feita na Fase 2 — o mesmo
provedor Google funciona para web e nativo.

## Publicação nas lojas (quando chegar a hora)

- **Google Play**: gerar um Android App Bundle assinado (`.aab`) pelo Android Studio
  (*Build → Generate Signed Bundle*) e subir no [Play Console](https://play.google.com/console).
- **App Store**: arquivar (*Product → Archive*) no Xcode e enviar via
  [App Store Connect](https://appstoreconnect.apple.com).
- Ambos exigem conta de desenvolvedor paga (Google: US$25 único; Apple: US$99/ano) e ícones/
  screenshots para a ficha da loja — isso fica para perto do lançamento (Fase 7).
