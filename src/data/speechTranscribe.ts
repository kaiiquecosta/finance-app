import { supabase } from '@/data/supabase'

export class SpeechTranscribeError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'SpeechTranscribeError'
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      const base64 = data.includes(',') ? data.split(',')[1] : data
      resolve(base64 ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Fallback servidor (Whisper) para navegadores sem ditado ao vivo. */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const audio = await blobToBase64(blob)
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string; message?: string }>(
    'speech-transcribe',
    { body: { audio, mime: blob.type || 'audio/webm' } },
  )

  if (error) {
    throw new SpeechTranscribeError(error.message || 'Não foi possível transcrever.')
  }
  if (data?.error === 'transcription_unconfigured') {
    throw new SpeechTranscribeError(
      data.message ||
        'Transcrição no servidor não configurada (OPENAI_API_KEY no Supabase).',
      'transcription_unconfigured',
    )
  }
  if (data?.error) {
    throw new SpeechTranscribeError(data.error)
  }
  const text = data?.text?.trim()
  if (!text) throw new SpeechTranscribeError('Não foi possível entender o áudio.')
  return text
}
