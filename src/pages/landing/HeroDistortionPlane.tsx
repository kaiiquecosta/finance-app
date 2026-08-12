import { useEffect, useRef } from 'react'

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.02 + 0.14;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;

    float t = uTime * 0.14;
    vec2 warp = vec2(
      fbm(p * 1.6 + vec2(t, 0.0)),
      fbm(p * 1.6 + vec2(0.0, t * 1.1) + 4.2)
    );
    warp = (warp - 0.5) * 0.18;
    p += warp + uMouse * 0.06;

    float field = fbm(p * 2.4 + vec2(t * 0.35, -t * 0.22));
    float pulse = sin(t * 1.4 + p.x * 3.0) * 0.5 + 0.5;

    vec3 deep = vec3(0.02, 0.04, 0.03);
    vec3 mid = vec3(0.04, 0.16, 0.09);
    vec3 accent = vec3(0.12, 0.55, 0.32);
    vec3 glow = vec3(0.45, 0.95, 0.65);

    vec3 col = mix(deep, mid, smoothstep(0.1, 0.85, uv.y));
    col = mix(col, accent, field * 0.75);
    col += glow * pulse * field * 0.12;

    float orb = smoothstep(0.55, 0.0, length(p - vec2(0.05, -0.08)));
    col += accent * orb * 0.35;

    float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.0, 1.15)));
    col *= vig;

    gl_FragColor = vec4(col, 0.72);
  }
`

/** Plano WebGL com shader de distorção — fundo vivo do hero. */
export function HeroDistortionPlane() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactViewport = window.matchMedia('(max-width: 720px)').matches
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    )
    if (reducedMotion || compactViewport || saveData) return

    let cancelled = false
    let dispose = () => {}

    void import('three').then((THREE) => {
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
      }

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
      scene.add(mesh)

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const w = Math.max(1, rect.width)
        const h = Math.max(1, rect.height)
        renderer.setSize(w, h, false)
        uniforms.uResolution.value.set(w, h)
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
      resize()

      const pointer = { x: 0, y: 0 }
      const onPointerMove = (event: PointerEvent) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
        pointer.y = -(event.clientY / window.innerHeight - 0.5) * 2
      }
      if (window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', onPointerMove, { passive: true })
      }

      let visible = true
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
      })
      visibilityObserver.observe(canvas)

      let frame = 0
      const start = performance.now()
      const render = (time: number) => {
        frame = requestAnimationFrame(render)
        if (!visible || document.hidden) return

        uniforms.uTime.value = (time - start) * 0.001
        uniforms.uMouse.value.x += (pointer.x - uniforms.uMouse.value.x) * 0.06
        uniforms.uMouse.value.y += (pointer.y - uniforms.uMouse.value.y) * 0.06

        renderer.render(scene, camera)
      }
      frame = requestAnimationFrame(render)

      dispose = () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visibilityObserver.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        mesh.geometry.dispose()
        material.dispose()
        renderer.dispose()
      }
    })

    return () => {
      cancelled = true
      dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-distortion-plane" aria-hidden="true" />
}
