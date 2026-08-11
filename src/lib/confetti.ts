/**
 * Zero-dependency HTML5 Canvas Confetti animation launcher.
 * Automatically creates an overlay canvas, fires celebratory particles, and cleans up.
 */
export function fireConfetti() {
  if (typeof window === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '99999'

  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const width = (canvas.width = window.innerWidth)
  const height = (canvas.height = window.innerHeight)

  const colors = [
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#38bdf8', // Sky blue
  ]

  interface Particle {
    x: number
    y: number
    w: number
    h: number
    vx: number
    vy: number
    rotation: number
    vRot: number
    color: string
    alpha: number
  }

  const particles: Particle[] = []
  const count = 90

  for (let i = 0; i < count; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.4 + (Math.random() - 0.5) * 100,
      w: Math.random() * 8 + 6,
      h: Math.random() * 12 + 6,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 14 - 6,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
    })
  }

  let startTime: number | null = null
  const duration = 2500 // 2.5s

  function render(timestamp: number) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = elapsed / duration

    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    let aliveCount = 0
    for (const p of particles) {
      if (p.alpha <= 0) continue
      aliveCount++

      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25 // gravity
      p.vx *= 0.98 // air resistance
      p.rotation += p.vRot

      if (progress > 0.6) {
        p.alpha = Math.max(0, 1 - (progress - 0.6) / 0.4)
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    if (progress < 1 && aliveCount > 0) {
      requestAnimationFrame(render)
    } else {
      canvas.remove()
    }
  }

  requestAnimationFrame(render)
}
