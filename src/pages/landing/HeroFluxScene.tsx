import { useEffect, useRef } from 'react'

/**
 * Cena 3D decorativa, carregada somente na landing.
 * Mantém o conteúdo e os controles em HTML para acessibilidade e SEO.
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

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio <= 1.5,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0, 7.5)

      const world = new THREE.Group()
      world.position.set(0, -0.15, 0)
      scene.add(world)

      const green = new THREE.Color('#3ddc84')
      const mint = new THREE.Color('#b8ffd5')

      const coreGeometry = new THREE.IcosahedronGeometry(1.7, 3)
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: green,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
      })
      const core = new THREE.Mesh(coreGeometry, coreMaterial)
      core.rotation.set(0.4, -0.35, 0.15)
      world.add(core)

      const shellGeometry = new THREE.IcosahedronGeometry(1.73, 1)
      const shellMaterial = new THREE.MeshBasicMaterial({
        color: mint,
        wireframe: true,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
      })
      const shell = new THREE.Mesh(shellGeometry, shellMaterial)
      world.add(shell)

      const ringGeometries: InstanceType<typeof THREE.TorusGeometry>[] = []
      const ringMaterials: InstanceType<typeof THREE.MeshBasicMaterial>[] = []
      const rings = [
        { radius: 2.25, tube: 0.008, tilt: [1.05, 0.15, 0.2] },
        { radius: 2.65, tube: 0.006, tilt: [0.35, 1.1, -0.3] },
        { radius: 3.05, tube: 0.005, tilt: [1.45, 0.55, 0.5] },
      ] as const

      rings.forEach(({ radius, tube, tilt }, index) => {
        const geometry = new THREE.TorusGeometry(radius, tube, 8, 160)
        const material = new THREE.MeshBasicMaterial({
          color: index === 1 ? mint : green,
          transparent: true,
          opacity: 0.13 - index * 0.025,
          blending: THREE.AdditiveBlending,
        })
        const ring = new THREE.Mesh(geometry, material)
        ring.rotation.set(tilt[0], tilt[1], tilt[2])
        ring.userData.speed = index % 2 ? -0.00011 : 0.00008
        ringGeometries.push(geometry)
        ringMaterials.push(material)
        world.add(ring)
      })

      const pointCount = 130
      const positions = new Float32Array(pointCount * 3)
      for (let i = 0; i < pointCount; i++) {
        const radius = 2.1 + Math.random() * 1.7
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = radius * Math.cos(phi)
      }
      const pointsGeometry = new THREE.BufferGeometry()
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const pointsMaterial = new THREE.PointsMaterial({
        color: green,
        size: 0.027,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const points = new THREE.Points(pointsGeometry, pointsMaterial)
      world.add(points)

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

      const target = { x: 0, y: 0 }
      const onPointerMove = (event: PointerEvent) => {
        target.x = (event.clientX / window.innerWidth - 0.5) * 0.45
        target.y = (event.clientY / window.innerHeight - 0.5) * 0.25
      }
      if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', onPointerMove, { passive: true })
      }

      let visible = true
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
      })
      visibilityObserver.observe(canvas)

      let previousTime = performance.now()
      let frame = 0
      const render = (time: number) => {
        frame = requestAnimationFrame(render)
        if (!visible || document.hidden) return

        const delta = Math.min((time - previousTime) / 1000, 0.05)
        previousTime = time
        if (!reducedMotion) {
          world.rotation.y += delta * 0.055
          core.rotation.y += delta * 0.08
          shell.rotation.x -= delta * 0.035
          points.rotation.y -= delta * 0.018
          world.rotation.x += (target.y - world.rotation.x) * 0.025
          world.position.x += (target.x - world.position.x) * 0.025
          world.children.forEach((child) => {
            if (child.userData.speed) child.rotation.z += child.userData.speed * 16
          })
        }
        renderer.render(scene, camera)
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)

      dispose = () => {
        cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        visibilityObserver.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        coreGeometry.dispose()
        coreMaterial.dispose()
        shellGeometry.dispose()
        shellMaterial.dispose()
        ringGeometries.forEach((geometry) => geometry.dispose())
        ringMaterials.forEach((material) => material.dispose())
        pointsGeometry.dispose()
        pointsMaterial.dispose()
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
