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

  useEffect(() => {
    if (open) openedAt.current = performance.now()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
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
      onClick={backdropClose}
      aria-hidden={!open}
      inert={!open}
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
