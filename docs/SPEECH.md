# Áudio no assistente (todos os navegadores + PWA)

## No app (automático)

1. **Chrome, Edge, Safari (ditado ao vivo)** — Web Speech API: texto aparece enquanto você fala.
2. **Firefox e outros (gravação)** — grava ao tocar 🎤, transcreve ao parar via Edge Function `speech-transcribe`.

Requisitos comuns:

- **HTTPS** (ou `localhost`) — microfone no PWA instalado também exige conexão segura.
- **Permissão de microfone** para o site/app Flux.

## Servidor (Firefox / fallback)

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy speech-transcribe
```

Sem `OPENAI_API_KEY`, o ditado **ao vivo** segue funcionando no Chrome/Edge/Safari; no Firefox o assistente avisa que falta configurar o secret.

Custo: áudio curto via [Whisper API](https://platform.openai.com/docs/guides/speech-to-text) (pay-as-you-go).

## iOS / PWA

- Instale o app pela tela inicial; na primeira gravação o iOS pede permissão de microfone.
- Ditado ao vivo usa `pt-BR`; em iPhone o modo contínuo é ajustado automaticamente.
