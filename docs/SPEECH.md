# Áudio no assistente (100% grátis)

O assistente usa **apenas o ditado do navegador** (Web Speech API). Não há cobrança da OpenAI nem outro serviço pago.

## Onde funciona o 🎤

| Ambiente | Áudio por voz |
|----------|----------------|
| **Chrome** (PC ou Android) | Sim, grátis |
| **Edge** | Sim, grátis |
| **Safari** (iPhone/iPad/Mac) | Sim, grátis |
| **PWA instalado** (tela inicial) | Sim, nos navegadores acima |
| **Firefox** | Não — use digitação ou abra no Chrome/Edge |

## Requisitos

- Site em **HTTPS** (ou `localhost` no desenvolvimento).
- **Permissão de microfone** para o Flux (o app pede ao tocar 🎤).
- **Internet** — o ditado do Chrome/Safari usa o serviço de voz do próprio navegador (sem conta OpenAI sua).

## Fluxo

1. Toque **🎤** → confirme no popup do app → permita no **popup do navegador** (se ainda não tiver permitido).
2. Fale; o texto aparece no campo.
3. Toque **🎤** de novo para parar.
4. Revise e envie com **↑**.

## Função `speech-transcribe` (opcional / legado)

A Edge Function `speech-transcribe` (Whisper/OpenAI) **não é usada** pelo app na versão atual. Você **não precisa** configurar `OPENAI_API_KEY` para o assistente.
