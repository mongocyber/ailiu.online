import { useEffect, useRef } from 'react'

/**
 * Eased custom cursor (fine-pointer devices only — App decides when to mount).
 * A 30px ring that follows the pointer with exponential easing and grows to a
 * 54px filled indigo ring over interactive targets.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cx = window.innerWidth / 2
    let cy = window.innerHeight / 2
    let tx = cx
    let ty = cy
    let hover = false
    let shown = false
    let raf = 0
    let prev = 0

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (!shown) {
        el.style.opacity = '1'
        shown = true
      }
    }
    const onOver = (e: Event) => {
      const target = e.target as Element | null
      hover = !!target?.closest('[data-cursor], a, button')
    }

    const loop = () => {
      cancelAnimationFrame(raf)
      const now = performance.now()
      const dt = prev ? Math.min(120, now - prev) : 16.67
      prev = now
      const k = 1 - Math.pow(1 - 0.2, dt / 16.67)
      cx += (tx - cx) * k
      cy += (ty - cy) * k
      el.style.transform = `translate(${cx}px,${cy}px)`
      el.style.width = hover ? '54px' : '30px'
      el.style.height = hover ? '54px' : '30px'
      el.style.margin = hover ? '-27px 0 0 -27px' : '-15px 0 0 -15px'
      el.style.background = hover ? 'rgba(45,43,212,0.12)' : 'transparent'
      el.style.borderColor = hover ? '#2D2BD4' : '#1A180F'
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove)
    document.addEventListener('mouseover', onOver)
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseover', onOver)
    }
  }, [])

  return <div ref={ref} className="cursor" aria-hidden="true" />
}
