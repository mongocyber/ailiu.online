import { useEffect, useRef } from 'react'
import { PANEL_COUNT, projects } from '../content'
import { Chrome } from './Chrome'
import { About } from './panels/About'
import { Contact } from './panels/Contact'
import { Hero } from './panels/Hero'
import { Work } from './panels/Work'

interface GalleryProps {
  isMobile: boolean
  detailOpen: boolean
}

const ACTIVE = '#1A180F'
const INACTIVE = '#CDC8BB'

/** Panels that center their content as a left-aligned column (Hero, Contact). */
const COLUMN_PANELS = new Set([0, PANEL_COUNT - 1])
const alignClass = (i: number) => (COLUMN_PANELS.has(i) ? 'align-col' : 'align-center')

export function Gallery({ isMobile, detailOpen }: GalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef<HTMLSpanElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const progRef = useRef<HTMLDivElement>(null)

  // Handlers read the latest detailOpen without re-binding listeners.
  const detailOpenRef = useRef(detailOpen)
  detailOpenRef.current = detailOpen

  // Jump handler differs per mode; Chrome calls through this stable indirection.
  const jumpRef = useRef<(i: number) => void>(() => {})

  useEffect(() => {
    const container = trackRef.current
    if (!container) return
    const panels = Array.from(container.children) as HTMLElement[]
    const n = panels.length

    const setActive = (i: number) => {
      if (idxRef.current) {
        idxRef.current.textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
      }
      const dots = dotsRef.current?.children
      if (dots) {
        for (let k = 0; k < dots.length; k++) {
          const dot = dots[k] as HTMLElement
          dot.style.background = k === i ? ACTIVE : INACTIVE
          dot.style.transform = k === i ? 'scale(1.35)' : 'scale(1)'
        }
      }
    }
    setActive(0)

    // ---------------------------------------------------------------- mobile
    if (isMobile) {
      // Reveal-on-enter, driven by rAF (not CSS transitions) so it is robust
      // and can never leave content stuck hidden.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const DUR = 700
      const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
      const tweens: { el: HTMLElement; start: number }[] = []
      let revealRaf = 0
      let lastTick = 0
      const tickReveal = () => {
        cancelAnimationFrame(revealRaf)
        const now = performance.now()
        lastTick = now
        for (let i = tweens.length - 1; i >= 0; i--) {
          const tw = tweens[i]
          const p = Math.max(0, Math.min(1, (now - tw.start) / DUR))
          const e = easeOut(p)
          tw.el.style.opacity = String(e)
          tw.el.style.transform = `translateY(${(1 - e) * 26}px)`
          if (p >= 1) {
            tw.el.style.transform = ''
            tweens.splice(i, 1)
          }
        }
        revealRaf = tweens.length ? requestAnimationFrame(tickReveal) : 0
      }
      // Keep tweens progressing even if rAF is throttled (hidden/background tab).
      const revealWatch = window.setInterval(() => {
        if (tweens.length && performance.now() - lastTick > 200) tickReveal()
      }, 240)
      const startTween = (el: HTMLElement) => {
        if (reduce) {
          el.style.opacity = '1'
          el.style.transform = ''
          return
        }
        const ri = parseInt(el.dataset.ri ?? '0', 10)
        tweens.push({ el, start: performance.now() + ri * 70 })
        if (!revealRaf) revealRaf = requestAnimationFrame(tickReveal)
      }
      // Position-based reveal (no IntersectionObserver dependency): an element
      // fades in once its top crosses into the lower 90% of the viewport.
      const pending = new Set(container.querySelectorAll<HTMLElement>('[data-reveal]'))
      const checkReveals = () => {
        if (!pending.size) return
        const h = window.innerHeight
        for (const el of Array.from(pending)) {
          const r = el.getBoundingClientRect()
          if (r.top < h * 0.9 && r.bottom > 0) {
            pending.delete(el)
            startTween(el)
          }
        }
      }
      checkReveals()

      let curIdx = 0
      const onScroll = () => {
        checkReveals()
        const scrollTop = window.scrollY
        const docH = document.documentElement.scrollHeight - window.innerHeight
        if (progRef.current) {
          progRef.current.style.width = `${docH > 0 ? (scrollTop / docH) * 100 : 0}%`
        }
        const viewCenter = scrollTop + window.innerHeight / 2
        let best = 0
        let bestDist = Infinity
        panels.forEach((p, i) => {
          const center = p.offsetTop + p.offsetHeight / 2
          const dist = Math.abs(center - viewCenter)
          if (dist < bestDist) {
            bestDist = dist
            best = i
          }
        })
        if (best !== curIdx) {
          curIdx = best
          setActive(best)
        }
      }
      jumpRef.current = (i) => {
        const target = panels[Math.max(0, Math.min(n - 1, i))]
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()

      return () => {
        cancelAnimationFrame(revealRaf)
        clearInterval(revealWatch)
        window.removeEventListener('scroll', onScroll)
      }
    }

    // --------------------------------------------------------------- desktop
    const viewport = container.parentElement as HTMLElement
    let W = window.innerWidth
    let max = (n - 1) * W
    let x = 0
    let targetX = 0
    let idx = 0
    let drag: { start: number; px: number } | null = null
    let raf = 0
    let prev = 0

    const layers = panels.map((p) => ({
      reveal: Array.from(p.querySelectorAll<HTMLElement>('[data-reveal]')),
      depth: Array.from(p.querySelectorAll<HTMLElement>('[data-depth]')),
    }))

    const clampX = (v: number) => Math.max(0, Math.min(max, v))
    const jump = (i: number) => {
      targetX = clampX(Math.max(0, Math.min(n - 1, i)) * W)
    }
    jumpRef.current = jump

    // Free linear horizontal scroll: wheel/trackpad delta maps straight to the
    // scroll target (no snap, no lock), and the rAF loop eases x toward it — like a
    // normal browser scroll, sideways. Robust, and never gets stuck.
    const onWheel = (e: WheelEvent) => {
      if (detailOpenRef.current) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? W : 1
      const dy = e.deltaY * unit
      const dx = e.deltaX * unit
      const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx
      targetX = clampX(targetX + d)
    }
    const onDown = (e: PointerEvent) => {
      if (detailOpenRef.current) return
      if ((e.target as Element).closest('a, button')) return
      drag = { start: targetX, px: e.clientX }
    }
    const onMove = (e: PointerEvent) => {
      if (drag) targetX = clampX(drag.start - (e.clientX - drag.px))
    }
    const onUp = () => {
      drag = null
    }
    const onKey = (e: KeyboardEvent) => {
      if (detailOpenRef.current) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        jump(idx + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        jump(idx - 1)
      }
    }
    const onResize = () => {
      W = window.innerWidth
      max = (n - 1) * W
      targetX = clampX(idx * W)
      x = targetX
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    const loop = () => {
      cancelAnimationFrame(raf)
      const now = performance.now()
      const dt = prev ? Math.min(120, now - prev) : 16.67
      prev = now
      const kx = 1 - Math.pow(1 - 0.11, dt / 16.67)
      x += (targetX - x) * kx
      if (Math.abs(targetX - x) < 0.4) x = targetX
      container.style.transform = `translate3d(${-x}px,0,0)`

      const ni = Math.max(0, Math.min(n - 1, Math.round(x / W)))
      if (ni !== idx) {
        idx = ni
        setActive(idx)
      }
      if (progRef.current) {
        progRef.current.style.width = `${max > 0 ? (x / max) * 100 : 0}%`
      }

      for (let i = 0; i < n; i++) {
        const d = (x - i * W) / W
        const a = Math.abs(d)
        // Fully visible while the panel occupies the viewport; fade only at the
        // entrance (right) / exit (left) edges so free scrolling stays readable.
        const prog = a <= 0.5 ? 1 : Math.max(0, Math.min(1, 1 - (a - 0.5) / 0.45))
        const layer = layers[i]
        for (const el of layer.reveal) {
          const ri = parseInt(el.dataset.ri ?? '0', 10)
          const r = Math.max(0, Math.min(1, (prog - ri * 0.05) * 1.5))
          el.style.opacity = String(r)
          el.style.transform = `translateY(${(1 - r) * 26}px)`
        }
        for (const el of layer.depth) {
          const dp = parseFloat(el.dataset.depth ?? '0')
          el.style.transform = `translateX(${d * dp}px)`
        }
      }

      raf = requestAnimationFrame(loop)
    }
    loop()
    const watchdog = window.setInterval(() => {
      if (performance.now() - prev > 220) loop()
    }, 260)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(watchdog)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [isMobile])

  const panelNodes = [
    <Hero key="hero" />,
    <About key="about" />,
    <Work key={projects[0].key} project={projects[0]} />,
    <Work key={projects[1].key} project={projects[1]} />,
    <Contact key="contact" />,
  ]

  return (
    <>
      {isMobile ? (
        <div className="stack" ref={trackRef}>
          {panelNodes.map((node, i) => (
            <section className="panel-m" key={i} data-panel={i}>
              {node}
            </section>
          ))}
        </div>
      ) : (
        <div className="viewport">
          <div className="track" ref={trackRef}>
            {panelNodes.map((node, i) => (
              <section className={`panel ${alignClass(i)}`} key={i} data-panel={i}>
                {node}
              </section>
            ))}
          </div>
        </div>
      )}

      <Chrome
        n={PANEL_COUNT}
        isMobile={isMobile}
        idxRef={idxRef}
        dotsRef={dotsRef}
        progRef={progRef}
        onJump={(i) => jumpRef.current(i)}
      />
    </>
  )
}
