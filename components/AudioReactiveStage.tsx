'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/lib/store'
import { getAnalyser } from '@/lib/audio-analyser'

/* ─── Vertex shader ───────────────────────────────────────────────────────── */
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

/* ─── Fragment shader ─────────────────────────────────────────────────────── */
/*
 * Visual intent:
 *   - Completely black when silent (no-op with mix-blend-mode:screen over dark page)
 *   - Amber/gold wisps rise from screen bottom & edges when bass hits
 *   - Center region stays dark — content stays readable at all times
 *   - FBM drift speed scales with BPM so the visual tempo matches the music
 *
 * Performance: 3 noise octaves, rendered at 20% of CSS size (ResizeObserver),
 * 24fps cap. Effective GPU load is minimal — comparable to a CSS animation.
 */
const FRAG = `
precision lowp float;

uniform float u_time;
uniform float u_bass;
uniform float u_mid;
uniform float u_playing;
uniform vec2  u_res;

float hash(vec2 p) {
  p  = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p  = p * 2.1 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;

  float t  = u_time * 0.10;

  /* Two overlapping noise layers for organic, non-repeating wisps */
  float n1 = fbm(uv * 2.2 + vec2( t * 0.60, t));
  float n2 = fbm(uv * 1.5 + vec2(-t * 0.40, t * 0.90 + 3.7));
  float n  = n1 * 0.60 + n2 * 0.40;

  /* Amber accent: #c8a86a */
  vec3 amber = vec3(0.784, 0.659, 0.416);

  /* ── Spatial mask ────────────────────────────────────────────────────────
   * Glow is concentrated at the bottom 40% of the screen and the outer edges.
   * The top 60% remains completely dark so text and beat cards stay readable.
   * ─────────────────────────────────────────────────────────────────────── */

  /* Bottom ramp: 1.0 at very bottom → 0.0 at 40% up */
  float bottomRamp = clamp(1.0 - uv.y * 2.5, 0.0, 1.0);
  bottomRamp = pow(bottomRamp, 1.4);

  /* Side edges: x-axis distance from centre, dampened above bottom third */
  float xEdge    = pow(abs(uv.x * 2.0 - 1.0), 2.2);
  float sideRamp = xEdge * clamp(1.0 - uv.y * 3.2, 0.0, 1.0);

  float mask = clamp(bottomRamp + sideRamp * 0.45, 0.0, 1.0);

  /* ── Audio reactivity ────────────────────────────────────────────────────
   * Bass drives the primary glow. Mid adds a faint secondary layer.
   * u_playing provides the smooth 0→1 fade-in on play / 1→0 fade-out on pause.
   * ─────────────────────────────────────────────────────────────────────── */
  float energy  = u_bass * 0.75 + u_mid * 0.12;
  float glow    = n * mask * energy * u_playing;

  /* Cap: 38% of full amber at absolute maximum so it never competes with content */
  vec3 col = amber * clamp(glow * 1.9, 0.0, 0.38);

  gl_FragColor = vec4(col, 1.0);
}
`

/* ─── WebGL helpers ───────────────────────────────────────────────────────── */
function buildShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const v = buildShader(gl, gl.VERTEX_SHADER, VERT)
  const f = buildShader(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!v || !f) return null
  const p = gl.createProgram()!
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AudioReactiveStage() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const isPlayingRef = useRef(false)
  const bpmRef       = useRef(120)

  /* Track play state + BPM via a store subscription to avoid re-running the
     WebGL setup effect on every render (the rAF loop reads from refs). */
  useEffect(() => {
    return usePlayerStore.subscribe((state) => {
      isPlayingRef.current = state.isPlaying
      bpmRef.current       = state.currentBeat?.bpm ?? 120
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* Kill immediately for users who have opted out of motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    })
    if (!gl) return

    const prog = buildProgram(gl)
    if (!prog) return

    /* Capture as consts so TypeScript knows they're non-null inside closures */
    const glCtx = gl
    const cvs   = canvas

    glCtx.clearColor(0, 0, 0, 1)

    /* Full-screen quad */
    const buf = glCtx.createBuffer()
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf)
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), glCtx.STATIC_DRAW)

    const posLoc    = glCtx.getAttribLocation(prog, 'a_pos')
    const uTime     = glCtx.getUniformLocation(prog, 'u_time')
    const uBass     = glCtx.getUniformLocation(prog, 'u_bass')
    const uMid      = glCtx.getUniformLocation(prog, 'u_mid')
    const uPlaying  = glCtx.getUniformLocation(prog, 'u_playing')
    const uRes      = glCtx.getUniformLocation(prog, 'u_res')

    /* Render at 20% of CSS size — the CSS stretch creates natural softness.
       This gives ~55× less GPU fill than rendering at full resolution. */
    const SCALE    = 0.20
    const FPS      = 24
    const FRAME_MS = 1000 / FPS

    const ro = new ResizeObserver(() => {
      cvs.width  = Math.max(1, Math.round(cvs.offsetWidth  * SCALE))
      cvs.height = Math.max(1, Math.round(cvs.offsetHeight * SCALE))
      glCtx.viewport(0, 0, cvs.width, cvs.height)
    })
    ro.observe(canvas)

    /* Exponentially smoothed audio values — prevents jittery uniforms */
    let smoothBass  = 0
    let smoothMid   = 0
    let playingFade = 0  // 0 = silent, 1 = fully playing

    const FADE_IN  = 0.022  // ~1.8s to fully appear  (24fps)
    const FADE_OUT = 0.015  // ~2.7s to fully disappear

    let lastFrame   = 0
    let rafId       = 0
    const start     = performance.now()
    const freqData  = new Uint8Array(64)  // matches analyser.frequencyBinCount

    function render(now: number): void {
      rafId = requestAnimationFrame(render)
      if (now - lastFrame < FRAME_MS) return
      lastFrame = now

      const playing = isPlayingRef.current

      /* Smooth fade in / out */
      playingFade = playing
        ? Math.min(1, playingFade + FADE_IN)
        : Math.max(0, playingFade - FADE_OUT)

      /* Sample the audio analyser (available only after first user play gesture) */
      const analyser = getAnalyser()
      if (analyser && playing) {
        analyser.getByteFrequencyData(freqData)

        /* Bass: bins 0–4 ≈ 0–1400 Hz */
        let bassSum = 0
        for (let i = 0; i < 5; i++) bassSum += freqData[i]
        const rawBass = bassSum / (5 * 255)

        /* Mid: bins 5–17 ≈ 1400–5800 Hz */
        let midSum = 0
        for (let i = 5; i < 18; i++) midSum += freqData[i]
        const rawMid = midSum / (13 * 255)

        /* EMA smoothing — fast attack (0.30), slow release (0.88) */
        const bassAlpha = rawBass > smoothBass ? 0.30 : 0.88
        const midAlpha  = rawMid  > smoothMid  ? 0.25 : 0.88
        smoothBass = smoothBass * (1 - bassAlpha) + rawBass * bassAlpha
        smoothMid  = smoothMid  * (1 - midAlpha)  + rawMid  * midAlpha
      } else {
        /* Decay toward silence */
        smoothBass *= 0.90
        smoothMid  *= 0.90
      }

      /* When completely faded out, just clear to black — no shader cost */
      if (playingFade < 0.004) {
        glCtx.clear(glCtx.COLOR_BUFFER_BIT)
        return
      }

      /* BPM-scaled time: 120 BPM = 1.0×, 140 BPM = 1.17×, 90 BPM = 0.75× */
      const bpmScale = bpmRef.current / 120
      const t = ((now - start) / 1000) * bpmScale

      glCtx.useProgram(prog)
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf)
      glCtx.enableVertexAttribArray(posLoc)
      glCtx.vertexAttribPointer(posLoc, 2, glCtx.FLOAT, false, 0, 0)

      glCtx.uniform1f(uTime,    t)
      glCtx.uniform1f(uBass,    smoothBass)
      glCtx.uniform1f(uMid,     smoothMid)
      glCtx.uniform1f(uPlaying, playingFade)
      glCtx.uniform2f(uRes,     cvs.width, cvs.height)

      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{
        zIndex: 10,
        mixBlendMode: 'screen',
        /* image-rendering default (auto) lets the GPU bilinear-filter the
           20% canvas up to full size — this gives the soft, blurred look
           without any extra CSS filter cost. */
      }}
    />
  )
}
