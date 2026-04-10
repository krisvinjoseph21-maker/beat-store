/**
 * Singleton audio analyser — shared between BottomPlayer and WaveformVisualizer.
 *
 * AudioContext creation is deferred until the first user-initiated play (browser
 * policy requires a user gesture). Safe to call connectAudioElement() multiple
 * times — it's a no-op after the first successful connection.
 *
 * If the audio element can't be connected (CORS not configured, API unavailable,
 * Safari WebKit quirk), the visualisation degrades silently — playback is unaffected.
 */

let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let connected = false

/** Returns the shared AnalyserNode, or null if not yet connected. */
export function getAnalyser(): AnalyserNode | null {
  return analyser
}

/**
 * Connect an HTMLAudioElement to the shared AnalyserNode.
 * Must be called from a user-gesture handler (click, keydown, etc.).
 * Idempotent — subsequent calls resume a suspended context but don't reconnect.
 */
export function connectAudioElement(el: HTMLAudioElement): void {
  if (connected) {
    resumeContext()
    return
  }

  try {
    if (!ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext ?? (window as any).webkitAudioContext
      if (!AC) return
      ctx = new AC()
    }

    if (!analyser) {
      analyser = ctx.createAnalyser()
      analyser.fftSize = 128            // 64 frequency bins — good detail/perf balance
      analyser.smoothingTimeConstant = 0.82   // smooth rapid transients
      analyser.minDecibels = -90
      analyser.maxDecibels = -10
    }

    const source = ctx.createMediaElementSource(el)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    connected = true
    resumeContext()
  } catch {
    // CORS blocked, element already connected elsewhere, or API unavailable.
    // Visualisation will be absent but audio plays normally.
  }
}

/** Resume a suspended AudioContext (browsers auto-suspend on inactivity). */
export function resumeContext(): void {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}
