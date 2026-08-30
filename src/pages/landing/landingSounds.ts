type SfxKind = 'key' | 'send' | 'like' | 'notify' | 'money'

let audioCtx: AudioContext | null = null
let unlocked = false

function prefersReducedSound(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function unlockLandingAudio() {
  if (prefersReducedSound()) return
  try {
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    unlocked = true
  } catch {
    /* ignore — autoplay blocked or unsupported */
  }
}

export function bindLandingAudioUnlock() {
  if (typeof window === 'undefined') return () => {}
  const unlock = () => unlockLandingAudio()
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true })
  window.addEventListener('touchstart', unlock, { once: true, passive: true })
  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('touchstart', unlock)
  }
}

function ctx(): AudioContext | null {
  if (prefersReducedSound() || !unlocked) return null
  if (!audioCtx) return null
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
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

function noiseBurst(c: AudioContext, at: number, dur = 0.018, gain = 0.025) {
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
  filter.type = 'highpass'
  filter.frequency.value = 1200
  const g = c.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(c.destination)
  src.start(at)
  src.stop(at + dur + 0.01)
}

export function playLandingSfx(kind: SfxKind) {
  const c = ctx()
  if (!c) return
  const t = c.currentTime + 0.01

  switch (kind) {
    case 'key':
      noiseBurst(c, t, 0.014, 0.022)
      tone(c, { freq: 920 + Math.random() * 180, at: t, dur: 0.015, gain: 0.012, type: 'triangle' })
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
      tone(c, { freq: 180, at: t, dur: 0.07, gain: 0.055, type: 'square' })
      tone(c, { freq: 120, at: t + 0.06, dur: 0.09, gain: 0.05, type: 'square' })
      noiseBurst(c, t + 0.02, 0.035, 0.018)
      tone(c, { freq: 880, at: t + 0.08, dur: 0.05, gain: 0.02, type: 'sine' })
      break
    default:
      break
  }
}

/** Som de tecla — varia levemente a cada caractere. */
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
