/**
 * Áudio do walkthrough — estilo Apple: baixo, suave, sem clipping.
 * Pad ambiente + SFX discretos (nunca “estourados”).
 */
import { ensureLandingAudioReady } from './landingSounds'

let sessions = 0
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicNodes: Array<AudioNode | OscillatorNode> = []
let musicRunning = false

function reduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
}

async function getCtx(): Promise<AudioContext | null> {
  if (reduced()) return null
  await ensureLandingAudioReady()
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  if (!masterGain || masterGain.context !== audioCtx) {
    masterGain = audioCtx.createGain()
    // Volume geral bem baixo (Apple-like)
    masterGain.gain.value = 0.22
    masterGain.connect(audioCtx.destination)
  }
  return audioCtx.state === 'running' ? audioCtx : null
}

function softTone(
  c: AudioContext,
  {
    freq,
    at,
    dur = 0.08,
    type = 'sine',
    gain = 0.012,
  }: { freq: number; at: number; dur?: number; type?: OscillatorType; gain?: number },
) {
  if (!masterGain) return
  const osc = c.createOscillator()
  const g = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2800
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(filter)
  filter.connect(g)
  g.connect(masterGain)
  osc.start(at)
  osc.stop(at + dur + 0.03)
}

function mayPlay() {
  return sessions > 0 && !reduced()
}

export function enterWalkthroughSounds() {
  sessions += 1
}

export function leaveWalkthroughSounds() {
  sessions = Math.max(0, sessions - 1)
  if (sessions === 0) stopWalkthroughMusic()
}

/** Pad cinematográfico suave — acordes abertos, quase ambient. */
export async function startWalkthroughMusic() {
  if (!mayPlay() || musicRunning) return
  const c = await getCtx()
  if (!c || !mayPlay() || !masterGain) return

  musicRunning = true
  const t0 = c.currentTime + 0.08

  const pad = c.createGain()
  pad.gain.setValueAtTime(0.0001, t0)
  pad.gain.linearRampToValueAtTime(0.045, t0 + 2.4)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(420, t0)
  filter.Q.value = 0.4

  // Cmaj7 / Am7 vibe suave
  const freqs = [130.81, 196.0, 261.63, 329.63, 392.0]
  for (const freq of freqs) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    osc.connect(pad)
    osc.start(t0)
    musicNodes.push(osc)
  }

  // Harmônico muito baixo
  const soft = c.createOscillator()
  soft.type = 'triangle'
  soft.frequency.setValueAtTime(523.25, t0)
  const softGain = c.createGain()
  softGain.gain.value = 0.18
  soft.connect(softGain)
  softGain.connect(pad)
  soft.start(t0)
  musicNodes.push(soft, softGain)

  pad.connect(filter)
  filter.connect(masterGain)
  musicNodes.push(pad, filter)

  // LFO quase imperceptível na amplitude
  const lfo = c.createOscillator()
  const lfoG = c.createGain()
  lfo.frequency.value = 0.05
  lfoG.gain.value = 0.008
  lfo.connect(lfoG)
  lfoG.connect(pad.gain)
  lfo.start(t0)
  musicNodes.push(lfo, lfoG)
}

export function stopWalkthroughMusic() {
  if (!audioCtx || !musicRunning) {
    musicRunning = false
    musicNodes = []
    return
  }
  const t = audioCtx.currentTime
  for (const node of musicNodes) {
    if (node instanceof GainNode) {
      try {
        node.gain.cancelScheduledValues(t)
        node.gain.setValueAtTime(node.gain.value, t)
        node.gain.linearRampToValueAtTime(0.0001, t + 0.5)
      } catch {
        /* noop */
      }
    }
    if (node instanceof OscillatorNode) {
      try {
        node.stop(t + 0.55)
      } catch {
        /* noop */
      }
    }
  }
  musicNodes = []
  musicRunning = false
}

export async function playWalkthroughClick() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  softTone(c, { freq: 720, at: c.currentTime, dur: 0.05, gain: 0.01, type: 'sine' })
}

export async function playWalkthroughWhoosh() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c || !masterGain) return
  const t = c.currentTime
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.28), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.8) * 0.35
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(600, t)
  filter.frequency.exponentialRampToValueAtTime(1400, t + 0.12)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.018, t + 0.05)
  g.gain.linearRampToValueAtTime(0.0001, t + 0.26)
  src.connect(filter)
  filter.connect(g)
  g.connect(masterGain)
  src.start(t)
  src.stop(t + 0.28)
}

export async function playWalkthroughImpact() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  const t = c.currentTime
  softTone(c, { freq: 261.63, at: t, dur: 0.22, gain: 0.014, type: 'sine' })
  softTone(c, { freq: 392.0, at: t + 0.08, dur: 0.28, gain: 0.011, type: 'sine' })
}

export async function playWalkthroughSend() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  const t = c.currentTime
  softTone(c, { freq: 440, at: t, dur: 0.06, gain: 0.01, type: 'sine' })
  softTone(c, { freq: 660, at: t + 0.05, dur: 0.08, gain: 0.009, type: 'sine' })
}

export async function playWalkthroughKey() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  softTone(c, { freq: 680, at: c.currentTime, dur: 0.028, gain: 0.007, type: 'triangle' })
}
