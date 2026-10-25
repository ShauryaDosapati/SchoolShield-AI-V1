import type { Severity } from '../types'

let ctx: AudioContext | null = null

/** Short two-tone chime; critical alerts get a more urgent triple pulse. */
export function playAlertTone(severity: Severity) {
  try {
    ctx ??= new AudioContext()
    const pulses = severity === 'critical' ? 3 : 2
    const base = severity === 'critical' ? 880 : severity === 'high' ? 740 : 620
    for (let i = 0; i < pulses; i++) {
      const t = ctx.currentTime + i * 0.18
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(i % 2 ? base * 1.25 : base, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.16)
    }
  } catch {
    // Audio unavailable (no user gesture yet, or unsupported) — alerts still show visually.
  }
}
