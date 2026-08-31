type SfxKind = 'key' | 'send' | 'like' | 'notify' | 'money'

/** WAV silencioso (~0,05s) — autoplay permitido quando muted. */
const SILENT_WAV =
  'data:audio/wav;base64,GkXfo56ChoEBQveBAULygQRC84EAQGBoaKGhpRnFOiYfExfnNQAEP31A8OB46sKTdNja2N9'

const PRIME_AUDIO_ID = 'flux-silent-prime'

let audioCtx: AudioContext | null = null
let inflightReady: Promise<boolean> | null = null
let passiveBound = false
let retryTimer: number | null = null

function prefersReducedSound(): boolean {
  if (typeof window === 'undefined') return true
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getPrimeElement(): HTMLAudioElement {
  const existing = document.getElementById(PRIME_AUDIO_ID) as HTMLAudioElement | null
  if (existing) return existing

  const el = document.createElement('audio')
  el.id = PRIME_AUDIO_ID
  el.src = SILENT_WAV
  el.muted = true
  el.volume = 0
  el.loop = true
  el.autoplay = true
  el.preload = 'auto'
  el.setAttribute('playsinline', '')
  el.style.display = 'none'
  document.body.appendChild(el)
  return el
}

async function primeMutedAutoplay(): Promise<void> {
  if (typeof window === 'undefined') return
  const el = getPrimeElement()
  el.muted = true
  el.volume = 0
  await el.play()
}

async function attemptReady(): Promise<boolean> {
  if (prefersReducedSound()) return false

  try {
    await primeMutedAutoplay().catch(() => undefined)
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    return audioCtx.state === 'running'
  } catch {
    return false
  }
}

/** Prepara áudio automaticamente — sem exigir clique prévio. */
export async function ensureLandingAudioReady(): Promise<boolean> {
  if (prefersReducedSound()) return false
  if (audioCtx?.state === 'running') return true

  if (!inflightReady) {
    inflightReady = attemptReady().finally(() => {
      inflightReady = null
    })
  }

  return inflightReady
}

function scheduleReadyRetries() {
  if (typeof window === 'undefined' || retryTimer != null) return
  retryTimer = window.setInterval(() => {
    if (audioCtx?.state === 'running') {
      window.clearInterval(retryTimer!)
      retryTimer = null
      return
    }
    void ensureLandingAudioReady()
  }, 1200)
}

function bindPassiveUnlock() {
  if (passiveBound || typeof window === 'undefined') return
  passiveBound = true

  const tryUnlock = () => {
    void ensureLandingAudioReady()
  }

  for (const event of ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown', 'mousemove'] as const) {
    window.addEventListener(event, tryUnlock, { passive: true, capture: true })
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryUnlock()
  })
}

/** @deprecated Mantido só por compatibilidade — agora é automático. */
export function unlockLandingAudio() {
  void ensureLandingAudioReady()
}

/** Inicializa áudio assim que a landing monta. */
export function initLandingAudio() {
  bindPassiveUnlock()
  void ensureLandingAudioReady()
  scheduleReadyRetries()
}

function tone(
  c: AudioContext,
  {
    freq,
    at,
    dur = 0.08,
    type = 'sine',
    gain = 0.06,
    attack = 0.004,
    release = 0.06,
  }: {
    freq: number
    at: number
    dur?: number
    type?: OscillatorType
    gain?: number
    attack?: number
    release?: number
  },
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + release)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(at)
  osc.stop(at + dur + release + 0.02)
}

function noiseBurst(
  c: AudioContext,
  at: number,
  dur = 0.018,
  gain = 0.025,
  filterHz = 1200,
  filterType: BiquadFilterType = 'highpass',
) {
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur))
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t)
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterHz
  if (filterType === 'bandpass') filter.Q.value = 1.4
  const g = c.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(c.destination)
  src.start(at)
  src.stop(at + dur + 0.01)
}

/** Clique seco estilo Magic Keyboard — tick alto, curto e bem audível. */
function keyboardClick(c: AudioContext, at: number) {
  const pitch = 2100 + Math.random() * 1100
  noiseBurst(c, at, 0.004, 0.078, 2600, 'highpass')
  noiseBurst(c, at + 0.001, 0.005, 0.062, 3400, 'bandpass')
  noiseBurst(c, at + 0.002, 0.007, 0.04, 1800, 'highpass')
  tone(c, {
    freq: pitch,
    at,
    dur: 0.004,
    gain: 0.058,
    type: 'sine',
    attack: 0.0004,
    release: 0.005,
  })
  tone(c, {
    freq: pitch * 1.14,
    at: at + 0.001,
    dur: 0.003,
    gain: 0.042,
    type: 'triangle',
    attack: 0.0004,
    release: 0.004,
  })
  tone(c, {
    freq: 760 + Math.random() * 160,
    at: at + 0.002,
    dur: 0.007,
    gain: 0.014,
    type: 'sine',
    attack: 0.001,
    release: 0.006,
  })
}

/** Confirmação positiva — gasto registrado com sucesso (sem tom de perda). */
function successRegistered(c: AudioContext, at: number) {
  tone(c, { freq: 523, at, dur: 0.07, gain: 0.048, type: 'sine', attack: 0.003, release: 0.06 })
  tone(c, { freq: 659, at: at + 0.055, dur: 0.08, gain: 0.044, type: 'sine', attack: 0.003, release: 0.065 })
  tone(c, { freq: 784, at: at + 0.11, dur: 0.09, gain: 0.04, type: 'triangle', attack: 0.003, release: 0.07 })
  tone(c, { freq: 988, at: at + 0.16, dur: 0.12, gain: 0.036, type: 'sine', attack: 0.004, release: 0.08 })
  tone(c, { freq: 1175, at: at + 0.22, dur: 0.14, gain: 0.028, type: 'sine', attack: 0.004, release: 0.1 })
  noiseBurst(c, at + 0.18, 0.012, 0.012, 4200, 'highpass')
}

function playKind(c: AudioContext, kind: SfxKind) {
  const t = c.currentTime + 0.01

  switch (kind) {
    case 'key':
      keyboardClick(c, t)
      break
    case 'send':
      tone(c, { freq: 520, at: t, dur: 0.07, gain: 0.05, type: 'sine' })
      tone(c, { freq: 780, at: t + 0.05, dur: 0.09, gain: 0.045, type: 'sine' })
      break
    case 'like':
      tone(c, { freq: 660, at: t, dur: 0.05, gain: 0.04, type: 'sine' })
      tone(c, { freq: 990, at: t + 0.04, dur: 0.07, gain: 0.035, type: 'triangle' })
      break
    case 'notify':
      tone(c, { freq: 587, at: t, dur: 0.1, gain: 0.05, type: 'sine' })
      tone(c, { freq: 740, at: t + 0.11, dur: 0.12, gain: 0.05, type: 'sine' })
      tone(c, { freq: 988, at: t + 0.24, dur: 0.16, gain: 0.045, type: 'triangle' })
      break
    case 'money':
      successRegistered(c, t)
      break
    default:
      break
  }
}

async function playLandingSfxInternal(kind: SfxKind) {
  const ready = await ensureLandingAudioReady()
  if (!ready || !audioCtx || audioCtx.state !== 'running') return
  playKind(audioCtx, kind)
}

export function playLandingSfx(kind: SfxKind) {
  void playLandingSfxInternal(kind)
}

export function playKeyTap() {
  playLandingSfx('key')
}

export function playSendSfx() {
  playLandingSfx('send')
}

export function playLikeSfx() {
  playLandingSfx('like')
}

export function playNotifySfx() {
  playLandingSfx('notify')
}

export function playMoneyOutSfx() {
  playLandingSfx('money')
}
