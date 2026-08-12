import { useEffect, useRef } from 'react'
import type { Material, Mesh, MeshStandardMaterial } from 'three'

type Spring2 = { x: number; y: number; vx: number; vy: number }

/** Mola amortecida — movimento mais cinematográfico (estilo Oryzo/Lusion). */
function stepSpring(state: Spring2, targetX: number, targetY: number, delta: number) {
  const stiffness = 4.2
  const damping = 5.8
  state.vx += (targetX - state.x) * stiffness * delta
  state.vy += (targetY - state.y) * stiffness * delta
  state.vx *= Math.exp(-damping * delta)
  state.vy *= Math.exp(-damping * delta)
  state.x += state.vx * delta
  state.y += state.vy * delta
}

/**
 * Hero WebGL inspirado em Oryzo/Lusion:
 * objeto 3D sólido com Fresnel, luzes, scroll e mouse com mola.
 */
export function HeroFluxScene() {
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

      const hero = canvas.closest('.hero')
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x090909, 0.045)

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
      camera.position.set(0, 0.15, 6.2)

      const world = new THREE.Group()
      scene.add(world)

      const accent = new THREE.Color('#3ddc84')
      const mint = new THREE.Color('#b8ffd5')
      const deep = new THREE.Color('#0f3d28')

      scene.add(new THREE.AmbientLight(0x3ddc84, 0.22))
      const keyLight = new THREE.PointLight(0xffffff, 3.2, 24)
      keyLight.position.set(2.8, 2.4, 4.5)
      scene.add(keyLight)
      const fillLight = new THREE.PointLight(0x3ddc84, 2.4, 18)
      fillLight.position.set(-3.5, -1.2, 2)
      scene.add(fillLight)
      const rimLight = new THREE.PointLight(0xb8ffd5, 1.6, 16)
      rimLight.position.set(0, 0.5, -4)
      scene.add(rimLight)

      const knotGeo = new THREE.TorusKnotGeometry(1.05, 0.34, 220, 36)
      const knotMat = new THREE.MeshPhysicalMaterial({
        color: deep,
        emissive: accent,
        emissiveIntensity: 0.42,
        metalness: 0.92,
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0,
      })
      const knot = new THREE.Mesh(knotGeo, knotMat)
      world.add(knot)

      const glowGeo = new THREE.TorusKnotGeometry(1.12, 0.38, 120, 24)
      const glowMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      world.add(glow)

      const haloGeo = new THREE.RingGeometry(1.55, 1.62, 96)
      const haloMat = new THREE.MeshBasicMaterial({
        color: mint,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.rotation.x = Math.PI / 2
      world.add(halo)

      const orbitGroup = new THREE.Group()
      world.add(orbitGroup)
      const orbitMeshes: Mesh[] = []
      for (let i = 0; i < 3; i++) {
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.045, 32),
          new THREE.MeshStandardMaterial({
            color: deep,
            emissive: accent,
            emissiveIntensity: 0.55,
            metalness: 0.95,
            roughness: 0.12,
            transparent: true,
            opacity: 0,
          }),
        )
        disc.rotation.x = Math.PI / 2
        disc.userData.orbit = i * ((Math.PI * 2) / 3)
        orbitMeshes.push(disc)
        orbitGroup.add(disc)
      }

      const particleCount = 180
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        const r = 1.8 + Math.random() * 2.4
        const t = Math.random() * Math.PI * 2
        const p = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = r * Math.sin(p) * Math.cos(t)
        positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
        positions[i * 3 + 2] = r * Math.cos(p)
      }
      const particlesGeo = new THREE.BufferGeometry()
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const particlesMat = new THREE.PointsMaterial({
        color: mint,
        size: 0.028,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
      const particles = new THREE.Points(particlesGeo, particlesMat)
      world.add(particles)

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const width = Math.max(1, rect.width)
        const height = Math.max(1, rect.height)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
      resize()

      const pointer = { x: 0, y: 0, active: false }
      const spring: Spring2 = { x: 0, y: 0, vx: 0, vy: 0 }
      const onPointerMove = (event: PointerEvent) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
        pointer.active = true
      }
      const onPointerLeave = () => {
        pointer.active = false
      }
      if (window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', onPointerMove, { passive: true })
        window.addEventListener('pointerleave', onPointerLeave)
      }

      let scrollProgress = 0
      const updateScroll = () => {
        if (!hero) return
        const rect = hero.getBoundingClientRect()
        const span = Math.max(rect.height, 1)
        scrollProgress = Math.min(1, Math.max(0, (window.innerHeight * 0.35 - rect.top) / span))
      }
      updateScroll()
      window.addEventListener('scroll', updateScroll, { passive: true })

      let visible = true
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
      })
      visibilityObserver.observe(canvas)

      const introStart = performance.now()
      const introDuration = 1.35

      let previousTime = performance.now()
      let frame = 0
      const render = (time: number) => {
        frame = requestAnimationFrame(render)
        if (!visible || document.hidden) return

        const delta = Math.min((time - previousTime) / 1000, 0.033)
        previousTime = time

        const introT = Math.min(1, (time - introStart) / introDuration)
        const introEase = 1 - Math.pow(1 - introT, 3)
        const reveal = introEase

        knotMat.opacity = 0.94 * reveal
        glowMat.opacity = 0.22 * reveal
        haloMat.opacity = 0.14 * reveal
        particlesMat.opacity = 0.5 * reveal
        orbitMeshes.forEach((disc) => {
          ;(disc.material as MeshStandardMaterial).opacity = 0.88 * reveal
        })

        const targetX = pointer.active ? pointer.x * 0.55 : 0
        const targetY = pointer.active ? -pointer.y * 0.35 : 0
        stepSpring(spring, targetX, targetY, delta)

        const baseScale = 0.72 + reveal * 0.28
        world.scale.setScalar(baseScale)

        world.rotation.y += delta * (0.18 + scrollProgress * 0.12)
        world.rotation.x = spring.y * 0.42 + scrollProgress * 0.28
        world.rotation.z = spring.x * 0.18
        world.position.x = spring.x * 0.55
        world.position.y = spring.y * 0.28 - scrollProgress * 0.35

        knot.rotation.x += delta * 0.12
        knot.rotation.y += delta * 0.22
        glow.rotation.copy(knot.rotation)
        halo.rotation.z += delta * 0.08

        orbitGroup.rotation.y += delta * 0.35
        orbitMeshes.forEach((disc) => {
          const angle = disc.userData.orbit + time * 0.00035
          disc.position.set(Math.cos(angle) * 2.05, Math.sin(angle * 1.3) * 0.35, Math.sin(angle) * 2.05)
          disc.lookAt(0, 0, 0)
        })

        particles.rotation.y -= delta * 0.06
        particles.rotation.x = spring.y * 0.08

        camera.position.z = 6.2 - scrollProgress * 1.4
        camera.position.y = 0.15 + scrollProgress * 0.25
        camera.lookAt(0, 0, 0)

        keyLight.position.x = 2.8 + spring.x * 1.2
        keyLight.position.y = 2.4 + spring.y * 0.8
        rimLight.intensity = 1.6 + (pointer.active ? 0.6 : 0)

        renderer.render(scene, camera)
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)

      dispose = () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visibilityObserver.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('scroll', updateScroll)
        knotGeo.dispose()
        knotMat.dispose()
        glowGeo.dispose()
        glowMat.dispose()
        haloGeo.dispose()
        haloMat.dispose()
        particlesGeo.dispose()
        particlesMat.dispose()
        orbitMeshes.forEach((disc) => {
          disc.geometry.dispose()
          ;(disc.material as Material).dispose()
        })
        renderer.dispose()
      }
    })

    return () => {
      cancelled = true
      dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-flux-scene" aria-hidden="true" />
}
