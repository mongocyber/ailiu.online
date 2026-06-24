import type { CSSProperties } from 'react'

interface PlaceholderProps {
  caption: string
  /** Identity-color corner square. Omit for no swatch (gallery tiles). */
  swatch?: string
  /** Wider stripe + larger swatch, used for detail cover blocks. */
  large?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Striped image placeholder. Replace with a real <img> (same dimensions) once
 * assets are available.
 */
export function Placeholder({ caption, swatch, large, className, style }: PlaceholderProps) {
  const cls = ['ph', large ? 'lg' : '', className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={cls} style={style}>
      {swatch ? <span className="swatch" style={{ background: swatch }} /> : null}
      <span className="cap">{caption}</span>
    </div>
  )
}
