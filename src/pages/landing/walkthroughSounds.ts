/**
 * Áudio estilo intro SaaS (Pora/Apple): baixo, ambient, com leve melodia.
 * Sem clipping — master ~0.18.
 */
import { ensureLandingAudioReady } from './landingSounds'

let sessions = 0
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let musicNodes: Array<AudioNode> = []
let musicRunning = false

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true
}

async function getCtx(): Promise<AudioContext | null> {
  if (reduced()) return null
  await ensureLandingAudioReady()
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  if (!masterGain || masterGain.context !== audioCtx) {
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.18
    masterGain.connect(audioCtx.destination)
  }
  return audioCtx.state === 'running' ? audioCtx : null
}

function softTone(
  c: AudioContext,
  {
    freq,
    at,
    dur = 0.1,
    type = 'sine',
    gain = 0.01,
  }: { freq: number; at: number; dur?: number; type?: OscillatorType; gain?: number },
) {
  if (!masterGain) return
  const osc = c.createOscillator()
  const g = c.createGain()
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2400
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.025)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(lp)
  lp.connect(g)
  g.connect(masterGain)
  osc.start(at)
  osc.stop(at + dur + 0.04)
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

/** Intro ambient: pad + arpejo lento (vibe de abertura de produto). */
export async function startWalkthroughMusic() {
  if (!mayPlay() || musicRunning) return
  const c = await getCtx()
  if (!c || !mayPlay() || !masterGain) return
  musicRunning = true
  const t0 = c.currentTime + 0.05

  const pad = c.createGain()
  pad.gain.setValueAtTime(0.0001, t0)
  pad.gain.linearRampToValueAtTime(0.055, t0 + 2.8)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(380, t0)
  filter.frequency.linearRampToValueAtTime(720, t0 + 8)
  filter.frequency.linearRampToValueAtTime(520, t0 + 20)

  // Acorde aberto (Cmaj9-ish) — intro
  for (const freq of [98.0, 130.81, 164.81, 196.0, 246.94, 329.63]) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    osc.connect(pad)
    osc.start(t0)
    musicNodes.push(osc)
  }

  pad.connect(filter)
  filter.connect(masterGain)
  musicNodes.push(pad, filter)

  // Arpejo muito suave a cada ~2.4s
  const arpGain = c.createGain()
  arpGain.gain.value = 0.012
  arpGain.connect(filter)
  musicNodes.push(arpGain)

  const arpNotes = [523.25, 659.25, 783.99, 659.25]
  let step = 0
  const scheduleArp = () => {
    if (!musicRunning || !audioCtx) return
    const now = audioCtx.currentTime
    const note = arpNotes[step % arpNotes.length]
    softTone(audioCtx, { freq: note, at: now, dur: 0.55, gain: 0.008, type: 'sine' })
    softTone(audioCtx, { freq: note / 2, at: now, dur: 0.7, gain: 0.004, type: 'triangle' })
    step += 1
  }
  scheduleArp()
  const arpTimer = window.setInterval(scheduleArp, 2400)
  musicNodes.push({ stop: () => window.clearInterval(arpTimer) } as unknown as AudioNode)

  const lfo = c.createOscillator()
  const lfoG = c.createGain()
  lfo.frequency.value = 0.04
  lfoG.gain.value = 0.01
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
    if ('stop' in node && typeof (node as { stop?: (when?: number) => void }).stop === 'function') {
      try {
        ;(node as OscillatorNode).stop(t + 0.6)
      } catch {
        try {
          ;(node as unknown as { stop: () => void }).stop()
        } catch {
          /* noop */
        }
      }
    }
    if (node instanceof GainNode) {
      try {
        node.gain.cancelScheduledValues(t)
        node.gain.setValueAtTime(node.gain.value, t)
        node.gain.linearRampToValueAtTime(0.0001, t + 0.55)
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
  softTone(c, { freq: 880, at: c.currentTime, dur: 0.04, gain: 0.008, type: 'sine' })
  softTone(c, { freq: 1320, at: c.currentTime + 0.02, dur: 0.03, gain: 0.005, type: 'triangle' })
}

export async function playWalkthroughWhoosh() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c || !masterGain) return
  const t = c.currentTime
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.32), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2) * 0.28
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(500, t)
  filter.frequency.exponentialRampToValueAtTime(1600, t + 0.14)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.014, t + 0.05)
  g.gain.linearRampToValueAtTime(0.0001, t + 0.3)
  src.connect(filter)
  filter.connect(g)
  g.connect(masterGain)
  src.start(t)
  src.stop(t + 0.32)
}

export async function playWalkthroughImpact() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  const t = c.currentTime
  softTone(c, { freq: 196.0, at: t, dur: 0.35, gain: 0.012, type: 'sine' })
  softTone(c, { freq: 293.66, at: t + 0.1, dur: 0.4, gain: 0.01, type: 'sine' })
  softTone(c, { freq: 392.0, at: t + 0.2, dur: 0.45, gain: 0.008, type: 'triangle' })
}

export async function playWalkthroughSend() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  softTone(c, { freq: 440, at: c.currentTime, dur: 0.07, gain: 0.008, type: 'sine' })
  softTone(c, { freq: 660, at: c.currentTime + 0.05, dur: 0.1, gain: 0.007, type: 'sine' })
}

export async function playWalkthroughKey() {
  if (!mayPlay()) return
  const c = await getCtx()
  if (!c) return
  softTone(c, { freq: 720, at: c.currentTime, dur: 0.025, gain: 0.005, type: 'triangle' })
}
