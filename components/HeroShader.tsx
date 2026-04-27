'use client'

import { useEffect, useRef } from 'react'

/* ─── Vertex shader ───────────────────────────────────────────────────────── */
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

/* ─── Fragment shader — lightweight, NO domain warp ──────────────────────── */
/* Performance budget:
 *   - Single fbm call, 3 octaves only (was 4 × fbm calls × 5 octaves = 20 noise evals/px)
 *   - Canvas renders at 30% of CSS size — CSS stretches it; blur is invisible at this scale
 *   - Result: ~55× less GPU work vs the original
 */
const FRAG = `
precision lowp float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/* 3 octaves — enough texture, cheap to compute */
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
  uv.y = 1.0 - uv.y;

  float t = u_time * 0.02;

  /* Single fbm pass — gentle drifting haze */
  float smoke = fbm(uv * 1.6 + vec2(t, t * 0.7));

  /* Very dark smoke base */
  vec3 col = vec3(0.035, 0.022, 0.008) * smoke * smoke * 4.0;

  /* Amber mouse glow */
  vec2 mouseUV = u_mouse / u_res;
  mouseUV.y = 1.0 - mouseUV.y;
  float d    = length(uv - mouseUV);
  float glow = exp(-d * 4.5) * 0.45 + exp(-d * 1.5) * 0.06;

  /* Modulate with smoke so light has texture */
  col += vec3(0.784, 0.659, 0.416) * glow * (0.6 + 0.4 * smoke);

  /* Vignette */
  float vig = 1.0 - length((uv - 0.5) * vec2(1.0, 1.3));
  col *= clamp(vig * 1.35, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`

/* ─── WebGL helpers ───────────────────────────────────────────────────────── */
function buildShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null }
  return s
}

function buildProgram(gl: WebGLRenderingContext) {
  const v = buildShader(gl, gl.VERTEX_SHADER,   VERT)
  const f = buildShader(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!v || !f) return null
  const p = gl.createProgram()!
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p)
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* Skip on mobile — no mouse interaction, weaker GPU, not worth it */
    if (window.innerWidth < 768) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    })
    if (!gl) return

    const prog = buildProgram(gl)
    if (!prog) return

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    const uTime  = gl.getUniformLocation(prog, 'u_time')
    const uRes   = gl.getUniformLocation(prog, 'u_res')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let rafId      = 0
    let framesDone = 0
    let visible    = true
    let mouseX     = 0
    let mouseY     = 0
    let centerSet  = false
    let lastFrame  = 0
    const FRAME_MS = 1000 / 24   /* 24fps cap — imperceptible on a slow ambient effect */
    const start    = performance.now()
    const glCtx    = gl

    /* Render at 30% of CSS size — canvas is CSS-stretched, blur is invisible */
    const SCALE = 0.30
    const ro = new ResizeObserver(() => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width  = Math.max(1, Math.round(w * SCALE))
      canvas.height = Math.max(1, Math.round(h * SCALE))
      glCtx.viewport(0, 0, canvas.width, canvas.height)
      if (!centerSet) { mouseX = w / 2; mouseY = h / 2; centerSet = true }
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(canvas)

    const section = canvas.parentElement
    function onMouse(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect()
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top
    }
    section?.addEventListener('mousemove', onMouse)

    function render(now: number) {
      rafId = requestAnimationFrame(render)
      if (!visible) return
      if (reduced && framesDone > 0) return
      if (now - lastFrame < FRAME_MS) return   /* skip frame — under target fps */
      lastFrame = now

      const w = canvas!.offsetWidth
      const h = canvas!.offsetHeight
      const t = (now - start) / 1000

      glCtx.useProgram(prog)
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buf)
      glCtx.enableVertexAttribArray(posLoc)
      glCtx.vertexAttribPointer(posLoc, 2, glCtx.FLOAT, false, 0, 0)
      glCtx.uniform1f(uTime,  t)
      glCtx.uniform2f(uRes,   w, h)
      glCtx.uniform2f(uMouse, mouseX, mouseY)
      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4)
      framesDone++
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
      section?.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full hidden md:block"
        style={{ zIndex: 3, mixBlendMode: 'screen' }}
      />
      {/* Static amber glow fallback for mobile where WebGL is skipped */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full md:hidden"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse 80% 55% at 50% 65%, rgba(200,168,106,0.07) 0%, transparent 70%)',
        }}
      />
    </>
  )
}
