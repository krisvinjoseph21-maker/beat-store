'use client'

import { useEffect, useRef } from 'react'

/* ─── Vertex shader ───────────────────────────────────────────────────────── */
const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

/* ─── Fragment shader ─────────────────────────────────────────────────────── */
const FRAG = `
precision mediump float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;   /* CSS-pixel space, origin top-left */

/* ── Value noise ─────────────────────────────────────────────────────────── */
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
    mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/* ── Fractal Brownian Motion — 5 octaves ─────────────────────────────────── */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2  r = mat2(0.8660, 0.5, -0.5, 0.8660); /* 30° rotation per octave */
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p  = r * p * 2.1 + vec2(1.7, 9.2);
    a *= 0.48;
  }
  return v;
}

void main() {
  /* UV — origin top-left, matching CSS */
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;

  float t = u_time * 0.022;

  /* Domain warp: two layers of fbm feeding into a third */
  vec2 q = vec2(
    fbm(uv * 2.2 + t),
    fbm(uv * 2.2 + vec2(5.2, 1.3) + t * 0.65)
  );
  float smoke = fbm(uv * 2.2 + q * 0.85 + t * 0.45);

  /* Very dark smoke — near-black base so screen-blend is subtle on top of video */
  vec3 col = vec3(0.04, 0.025, 0.01) * pow(smoke, 1.8) * 3.5;
  col      += vec3(0.06, 0.04, 0.015) * pow(smoke, 3.0) * 2.0;

  /* ── Mouse / touch light ─────────────────────────────────────────────── */
  vec2 mouseUV = u_mouse / u_res;
  mouseUV.y = 1.0 - mouseUV.y;
  float d = length(uv - mouseUV);

  /* Sharp inner glow + wide diffuse halo */
  float innerGlow = exp(-d * 5.2) * 0.42;
  float outerGlow = exp(-d * 1.6) * 0.07;
  float glow = innerGlow + outerGlow;

  /* Amber/gold: #c8a86a → (0.784, 0.659, 0.416) */
  vec3 amber = vec3(0.784, 0.659, 0.416);

  /* Light gets texture from smoke — looks like rays through haze */
  float smokeMask = 0.55 + 0.45 * smoke;
  col += amber * glow * smokeMask;

  /* Subtle vignette so edges are always dark */
  float vig = 1.0 - length((uv - 0.5) * vec2(1.0, 1.35));
  col *= clamp(vig * 1.4, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`

/* ─── WebGL helpers ───────────────────────────────────────────────────────── */
function buildShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s)
    return null
  }
  return s
}

function buildProgram(gl: WebGLRenderingContext) {
  const v = buildShader(gl, gl.VERTEX_SHADER,   VERT)
  const f = buildShader(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!v || !f) return null
  const p = gl.createProgram()!
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
  return p
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    /* Full-screen quad */
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    const uTime  = gl.getUniformLocation(prog, 'u_time')
    const uRes   = gl.getUniformLocation(prog, 'u_res')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    /* State */
    let rafId     = 0
    let framesDone = 0
    let visible   = true
    let mouseX    = 0   /* set to canvas center on first resize */
    let mouseY    = 0
    let centerSet = false
    const start   = performance.now()

    /* Resize + DPR */
    const ro = new ResizeObserver(() => {
      const w   = canvas.offsetWidth
      const h   = canvas.offsetHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (!centerSet) {
        mouseX    = w / 2
        mouseY    = h / 2
        centerSet = true
      }
    })
    ro.observe(canvas)

    /* Pause when hero scrolls off-screen */
    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting },
      { threshold: 0 }
    )
    io.observe(canvas)

    /* Mouse / touch tracking */
    const section = canvas.parentElement
    function onMouse(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect()
      mouseX = e.clientX - r.left
      mouseY = e.clientY - r.top
    }
    function onTouch(e: TouchEvent) {
      if (!e.touches[0]) return
      const r = canvas!.getBoundingClientRect()
      mouseX = e.touches[0].clientX - r.left
      mouseY = e.touches[0].clientY - r.top
    }
    section?.addEventListener('mousemove', onMouse)
    section?.addEventListener('touchmove', onTouch, { passive: true })

    /* Keep a non-null alias so the closure is happy */
    const glCtx = gl

    /* Render loop */
    function render() {
      rafId = requestAnimationFrame(render)
      if (!visible) return
      /* Reduced motion: render 1 static frame then stop animating */
      if (reduced && framesDone > 0) return

      const t = (performance.now() - start) / 1000
      const w = canvas!.offsetWidth
      const h = canvas!.offsetHeight

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

    render()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
      section?.removeEventListener('mousemove', onMouse)
      section?.removeEventListener('touchmove', onTouch)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ zIndex: 3, mixBlendMode: 'screen' }}
    />
  )
}
