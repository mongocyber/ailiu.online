import { useEffect, useRef } from 'react'

/**
 * Interactive Swiss-grid vector field rendered on a full-viewport canvas.
 *
 * A regular grid of short lines flows from an eased noise field, modulated by
 * moving diagonal opacity bands ("wind over a field"). Within a radius of the
 * pointer, lines swirl tangentially, lengthen, deepen and tip into accent
 * indigo. Everything is frame-rate independent. Honors prefers-reduced-motion
 * by drawing a single static frame with no pointer reaction.
 */
export function VectorField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    let sp = 0
    let cols = 0
    let rows = 0
    let ox = 0
    let oy = 0
    let t = 0
    let mx = -9999
    let my = -9999
    let raf = 0
    let prev = 0

    const setup = () => {
      W = window.innerWidth
      H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sp = Math.max(28, Math.round(Math.min(W, H) / 24))
      cols = Math.ceil(W / sp) + 1
      rows = Math.ceil(H / sp) + 1
      ox = (W - (cols - 1) * sp) / 2
      oy = (H - (rows - 1) * sp) / 2
    }

    const draw = () => {
      ctx.fillStyle = '#F2F0EA'
      ctx.fillRect(0, 0, W, H)
      const R = Math.max(210, Math.min(W, H) * 0.27)
      const R2 = R * R
      const baseLen = sp * 0.54
      const extraLen = sp * 0.52
      const HALF_PI = Math.PI / 2
      ctx.lineCap = 'round'

      const influenced: number[] = []

      // Pass 1 — the calm flowing field, batched into one stroke per opacity.
      let curOp = -1
      const flush = () => {
        if (curOp >= 0) ctx.stroke()
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * sp
          const y = oy + r * sp
          const a =
            Math.sin(x * 0.004 + t * 0.6) +
            Math.cos(y * 0.0042 - t * 0.45) +
            0.7 * Math.sin((x - y) * 0.003 + t * 0.3)
          const bx = Math.cos(a)
          const by = Math.sin(a)
          const dx = mx - x
          const dy = my - y
          const d2 = dx * dx + dy * dy
          if (d2 < R2) {
            influenced.push(x, y, bx, by, Math.sqrt(d2), dx, dy)
            continue
          }
          const band = 0.5 + 0.5 * Math.sin(x * 0.005 + y * 0.0034 - t * 0.8)
          const op = +(0.06 + 0.1 * band).toFixed(2)
          if (op !== curOp) {
            flush()
            ctx.strokeStyle = `rgba(26,24,15,${op})`
            ctx.lineWidth = 1
            ctx.beginPath()
            curOp = op
          }
          const hl = baseLen / 2
          ctx.moveTo(x - bx * hl, y - by * hl)
          ctx.lineTo(x + bx * hl, y + by * hl)
        }
      }
      flush()

      // Pass 2 — pointer vortex: swirl, lengthen, deepen, tip into accent.
      for (let i = 0; i < influenced.length; i += 7) {
        const x = influenced[i]
        const y = influenced[i + 1]
        let bx = influenced[i + 2]
        let by = influenced[i + 3]
        const dist = influenced[i + 4]
        const dx = influenced[i + 5]
        const dy = influenced[i + 6]
        let inf = 1 - dist / R
        inf *= inf
        const sw = Math.atan2(dy, dx) + HALF_PI
        const sx = Math.cos(sw)
        const sy = Math.sin(sw)
        bx += (sx - bx) * inf
        by += (sy - by) * inf
        const inv = 1 / (Math.hypot(bx, by) || 1)
        bx *= inv
        by *= inv
        const hl = (baseLen + inf * extraLen) / 2
        let cr = 26
        let cg = 24
        let cb = 15
        if (inf > 0.45) {
          const m = (inf - 0.45) / 0.55
          cr = 26 + 19 * m
          cg = 24 + 19 * m
          cb = 15 + 197 * m
        }
        ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${0.13 + inf * 0.45})`
        ctx.lineWidth = 1 + inf * 0.9
        ctx.beginPath()
        ctx.moveTo(x - bx * hl, y - by * hl)
        ctx.lineTo(x + bx * hl, y + by * hl)
        ctx.stroke()
      }
    }

    const loop = () => {
      cancelAnimationFrame(raf)
      const now = performance.now()
      const dt = prev ? Math.min(120, now - prev) : 16.67
      prev = now
      t += 0.005 * (dt / 16.67)
      draw()
      raf = requestAnimationFrame(loop)
    }

    setup()

    const onResize = () => {
      setup()
      if (reduce) draw()
    }
    window.addEventListener('resize', onResize)

    if (reduce) {
      draw()
      return () => window.removeEventListener('resize', onResize)
    }

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
    }
    const onLeave = () => {
      mx = -9999
      my = -9999
    }
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length) {
        mx = e.touches[0].clientX
        my = e.touches[0].clientY
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', onLeave)

    loop()
    // Keep state advancing if rAF is throttled (hidden/background tab).
    const watchdog = window.setInterval(() => {
      if (performance.now() - prev > 220) loop()
    }, 260)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(watchdog)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="vfield" aria-hidden="true" />
}
