import { useEffect, useRef } from 'react'

export interface LightboxData {
  src: string
  caption: string
}

/**
 * Full-screen image viewer. Opens when an image is clicked; closes on backdrop
 * click, the close button, or Esc.
 *
 * The Esc handler runs in the capture phase and stops propagation so it doesn't
 * also close the detail overlay. The backdrop close is guarded for a moment
 * after opening: the same click that opens the lightbox can otherwise land on
 * the freshly-rendered full-screen backdrop and immediately close it.
 */
export function Lightbox({ data, onClose }: { data: LightboxData | null; onClose: () => void }) {
  const open = data !== null
  const openedAt = useRef(0)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) openedAt.current = performance.now()
  }, [open])

  useEffect(() => {
    if (!open) return
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() =>
      (closeRef.current ?? ref.current)?.focus({ preventScroll: true }),
    )
    return () => {
      cancelAnimationFrame(frame)
      previouslyFocused.current?.focus({ preventScroll: true })
      previouslyFocused.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        closeRef.current?.focus({ preventScroll: true })
        return
      }
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  const backdropClose = () => {
    if (performance.now() - openedAt.current < 300) return
    onClose()
  }

  return (
    <div
      className={`lightbox${open ? ' open' : ''}`}
      ref={ref}
      onClick={backdropClose}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-label={open ? '图片预览' : undefined}
      aria-hidden={!open}
      inert={!open}
      tabIndex={open ? -1 : undefined}
    >
      {data ? (
        <figure className="lightbox-fig" onClick={(e) => e.stopPropagation()}>
          <img src={data.src} alt={data.caption} />
          <figcaption>{data.caption}</figcaption>
        </figure>
      ) : null}
      {data ? (
        <button
          className="lightbox-close"
          ref={closeRef}
          data-cursor
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="关闭"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}
