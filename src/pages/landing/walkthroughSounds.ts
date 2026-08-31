import { ensureLandingAudioReady } from './landingSounds'

let walkthroughSessions = 0
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicStop: (() => void) | null = null

function prefersReducedSound(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

async function ctx(): Promise<AudioContext | null> {
  if (prefersReducedSound()) return null
  const ready = await ensureLandingAudioReady()
  if (!ready) return null
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  if (!masterGain || masterGain.context !== audioCtx) {
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.85
    masterGain.connect(audioCtx.destination)
  }
  return audioCtx.state === 'running' ? audioCtx : null
}

function tone(
  c: AudioContext,
  {
    freq,
    at,
    dur = 0.07,
    type = 'sine',
    gain = 0.05,
  }: { freq: number; at: number; dur?: number; type?: OscillatorType; gain?: number },
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g)
  g.connect(masterGain ?? c.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

function mayPlay(): boolean {
  return walkthroughSessions > 0 && !prefersReducedSound()
}

export function enterWalkthroughSounds() {
  walkthroughSessions += 1
}

export function leaveWalkthroughSounds() {
  walkthroughSessions = Math.max(0, walkthroughSessions - 1)
  if (walkthroughSessions === 0) stopWalkthroughMusic()
}

export async function startWalkthroughMusic() {
  if (!mayPlay() || musicStop) return
  const c = await ctx()
  if (!c || !mayPlay()) return

  const t0 = c.currentTime + 0.05
  const padFreqs = [261.63, 329.63, 392.0, 493.88]
  const oscs: OscillatorNode[] = []
  const padGain = c.createGain()
  padGain.gain.setValueAtTime(0.0001, t0)
  padGain.gain.linearRampToValueAtTime(0.028, t0 + 1.8)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(680, t0)
  filter.frequency.linearRampToValueAtTime(920, t0 + 14)
  filter.frequency.linearRampToValueAtTime(720, t0 + 28)

  for (const freq of padFreqs) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    osc.connect(padGain)
    osc.start(t0)
    oscs.push(osc)
  }

  padGain.connect(filter)
  filter.connect(masterGain ?? c.destination)

  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.setValueAtTime(0.07, t0)
  lfoGain.gain.setValueAtTime(6, t0)
  lfo.connect(lfoGain)
  lfoGain.connect(padGain.gain)
  lfo.start(t0)

  musicStop = () => {
    const stopAt = c.currentTime + 0.4
    padGain.gain.cancelScheduledValues(c.currentTime)
    padGain.gain.setValueAtTime(padGain.gain.value, c.currentTime)
    padGain.gain.linearRampToValueAtTime(0.0001, stopAt)
    for (const osc of oscs) {
      try {
        osc.stop(stopAt)
      } catch {
        /* already stopped */
      }
    }
    try {
      lfo.stop(stopAt)
    } catch {
      /* noop */
    }
    musicStop = null
  }
}

export function stopWalkthroughMusic() {
  musicStop?.()
}

export async function playWalkthroughClick() {
  if (!mayPlay()) return
  const c = await ctx()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 880, at: t, dur: 0.04, gain: 0.035, type: 'triangle' })
  tone(c, { freq: 1320, at: t + 0.02, dur: 0.03, gain: 0.02, type: 'sine' })
}

export async function playWalkthroughWhoosh() {
  if (!mayPlay()) return
  const c = await ctx()
  if (!c) return
  const t = c.currentTime
  const noise = c.createBufferSource()
  const buffer = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  noise.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(900, t)
  filter.frequency.exponentialRampToValueAtTime(2400, t + 0.12)
  filter.Q.value = 0.8
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.045, t + 0.04)
  g.gain.linearRampToValueAtTime(0.0001, t + 0.22)
  noise.connect(filter)
  filter.connect(g)
  g.connect(masterGain ?? c.destination)
  noise.start(t)
  noise.stop(t + 0.25)
}

export async function playWalkthroughImpact() {
  if (!mayPlay()) return
  const c = await ctx()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 392, at: t, dur: 0.14, gain: 0.055, type: 'sine' })
  tone(c, { freq: 523.25, at: t + 0.06, dur: 0.16, gain: 0.05, type: 'sine' })
  tone(c, { freq: 659.25, at: t + 0.12, dur: 0.2, gain: 0.04, type: 'triangle' })
}

export async function playWalkthroughSend() {
  if (!mayPlay()) return
  const c = await ctx()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 520, at: t, dur: 0.07, gain: 0.045, type: 'sine' })
  tone(c, { freq: 780, at: t + 0.05, dur: 0.09, gain: 0.04, type: 'sine' })
}

export async function playWalkthroughKey() {
  if (!mayPlay()) return
  const c = await ctx()
  if (!c) return
  const t = c.currentTime
  tone(c, { freq: 740, at: t, dur: 0.035, gain: 0.028, type: 'triangle' })
}
