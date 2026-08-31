import { IOS_KEY_CLICKS } from './landingKeyboardSamples'

type SfxKind = 'key' | 'send' | 'like' | 'notify' | 'money'

/** WAV silencioso (~0,05s) — autoplay permitido quando muted. */
const SILENT_WAV =
  'data:audio/wav;base64,GkXfo56ChoEBQveBAULygQRC84EAQGBoaKGhpRnFOiYfExfnNQAEP31A8OB46sKTdNja2N9'

const PRIME_AUDIO_ID = 'flux-silent-prime'

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let successBuffer: AudioBuffer | null = null
let keyClickBuffers: AudioBuffer[] | null = null
let inflightReady: Promise<boolean> | null = null
let passiveBound = false
let retryTimer: number | null = null
let keyVariant = 0
let activeDemoSoundSessions = 0

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

function decodeWavBase64(c: AudioContext, b64: string): AudioBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const view = new DataView(bytes.buffer)
  const sampleRate = view.getUint32(24, true)
  const dataOffset = 44
  const sampleCount = (bytes.length - dataOffset) / 2
  const buffer = c.createBuffer(1, sampleCount, sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) {
    channel[i] = view.getInt16(dataOffset + i * 2, true) / 32768
  }
  return buffer
}

function ensureKeyBuffers(c: AudioContext) {
  if (keyClickBuffers) return
  keyClickBuffers = IOS_KEY_CLICKS.map((sample) => decodeWavBase64(c, sample))
}

/** Teclado iOS (iPhone) — toque curto; ganho calibrado para alto-falantes de PC. */
function playKeyClick(c: AudioContext) {
  ensureBuffers(c)
  ensureKeyBuffers(c)
  if (!masterGain || !keyClickBuffers?.length) return

  keyVariant = (keyVariant + 1) % keyClickBuffers.length
  const src = c.createBufferSource()
  src.buffer = keyClickBuffers[keyVariant]
  src.playbackRate.value = 0.992 + (keyVariant % 4) * 0.008

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 6200
  filter.Q.value = 0.55

  const g = c.createGain()
  g.gain.value = 1.18

  src.connect(filter)
  filter.connect(g)
  g.connect(masterGain)
  src.start()
}

/** Confirmação clara de sucesso — melodia curta, bem diferente do teclado. */
function bakeSuccessBuffer(c: AudioContext): AudioBuffer {
  const sr = c.sampleRate
  const dur = 0.52
  const length = Math.max(1, Math.floor(sr * dur))
  const buffer = c.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  const notes = [
    { freq: 392, at: 0, hold: 0.22, amp: 0.34 },
    { freq: 494, at: 0.1, hold: 0.24, amp: 0.32 },
    { freq: 587, at: 0.2, hold: 0.28, amp: 0.3 },
    { freq: 784, at: 0.32, hold: 0.34, amp: 0.26 },
  ]

  for (let i = 0; i < length; i++) {
    const t = i / sr
    let sample = 0
    for (const note of notes) {
      const local = t - note.at
      if (local < 0 || local > note.hold) continue
      const attack = 1 - Math.exp(-local * 55)
      const release = Math.exp(-Math.max(0, local - note.hold * 0.35) * 7)
      const env = attack * release
      sample += Math.sin(2 * Math.PI * note.freq * local) * env * note.amp
      sample += Math.sin(2 * Math.PI * note.freq * 2 * local) * env * note.amp * 0.08
    }
    data[i] = Math.max(-1, Math.min(1, sample))
  }

  return buffer
}

function ensureBuffers(c: AudioContext) {
  if (!masterGain || masterGain.context !== c) {
    masterGain = c.createGain()
    masterGain.gain.value = 1.08
    masterGain.connect(c.destination)
  }

  successBuffer ??= bakeSuccessBuffer(c)
}

function playBuffer(
  c: AudioContext,
  buffer: AudioBuffer,
  { gain = 1, playbackRate = 1 }: { gain?: number; playbackRate?: number } = {},
) {
  ensureBuffers(c)
  const src = c.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = playbackRate
  const g = c.createGain()
  g.gain.value = gain
  src.connect(g)
  g.connect(masterGain ?? c.destination)
  src.start()
}

function playSuccessChime(c: AudioContext) {
  ensureBuffers(c)
  if (!successBuffer) return
  playBuffer(c, successBuffer, { gain: 1.05 })
}

async function attemptReady(): Promise<boolean> {
  if (prefersReducedSound()) return false

  try {
    await primeMutedAutoplay().catch(() => undefined)
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    if (audioCtx.state === 'running') {
      ensureBuffers(audioCtx)
      ensureKeyBuffers(audioCtx)
      if (masterGain) masterGain.gain.setValueAtTime(1.08, audioCtx.currentTime)
    }
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
  ensureBuffers(c)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur + release)
  osc.connect(g)
  g.connect(masterGain ?? c.destination)
  osc.start(at)
  osc.stop(at + dur + release + 0.02)
}

function playKind(c: AudioContext, kind: SfxKind) {
  const t = c.currentTime + 0.01

  switch (kind) {
    case 'key':
      playKeyClick(c)
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
      playSuccessChime(c)
      break
    default:
      break
  }
}

function canPlayNow(): boolean {
  return !prefersReducedSound() && audioCtx?.state === 'running'
}

function mayPlayDemoSfx(): boolean {
  return activeDemoSoundSessions > 0
}

/** Marca uma demo da landing como visível — sons só tocam enquanto houver sessão ativa. */
export function enterLandingDemoSounds() {
  activeDemoSoundSessions += 1
}

/** Encerra sessão de som da demo; suspende áudio quando nenhuma demo estiver ativa. */
export function leaveLandingDemoSounds() {
  activeDemoSoundSessions = Math.max(0, activeDemoSoundSessions - 1)
  if (activeDemoSoundSessions === 0) stopLandingDemoSfx()
}

async function playLandingSfxInternal(kind: SfxKind) {
  const ready = await ensureLandingAudioReady()
  if (!mayPlayDemoSfx() || !ready || !audioCtx || audioCtx.state !== 'running') return
  playKind(audioCtx, kind)
}

export function playLandingSfx(kind: SfxKind) {
  if (!mayPlayDemoSfx()) return
  if (canPlayNow() && audioCtx) {
    playKind(audioCtx, kind)
    return
  }
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

/** Corta sons em andamento quando nenhuma demo está visível. */
export function stopLandingDemoSfx() {
  if (!audioCtx || !masterGain) return
  const t = audioCtx.currentTime
  masterGain.gain.cancelScheduledValues(t)
  masterGain.gain.setValueAtTime(0, t)
  if (audioCtx.state === 'running') void audioCtx.suspend()
}
