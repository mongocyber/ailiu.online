import type { RefObject } from 'react'
import { BRAND } from '../content'

interface ChromeProps {
  n: number
  isMobile: boolean
  idxRef: RefObject<HTMLSpanElement | null>
  dotsRef: RefObject<HTMLDivElement | null>
  progRef: RefObject<HTMLDivElement | null>
  onJump: (i: number) => void
}

/**
 * Persistent overlay UI: wordmark, current index + nav dots, scroll hint and
 * progress bar. Dynamic values (index text, active dot, progress width) are
 * written imperatively by the gallery loop / scroll listener via the refs.
 */
export function Chrome({ n, isMobile, idxRef, dotsRef, progRef, onJump }: ChromeProps) {
  const total = String(n).padStart(2, '0')

  return (
    <div className="chrome">
      <div className="wordmark">
        <span className="ring" />
        {BRAND} <span className="reg">®</span>
      </div>

      <div className="nav">
        <span className="idx" ref={idxRef}>
          01 / {total}
        </span>
        <div className="dots" ref={dotsRef}>
          {Array.from({ length: n }, (_, i) => (
            <button
              key={i}
              className="dot"
              data-i={i}
              data-cursor
              aria-label={`跳转到第 ${i + 1} 屏`}
              onClick={() => onJump(i)}
            />
          ))}
        </div>
      </div>

      <div className={`scrollhint${isMobile ? ' vertical' : ''}`}>
        {isMobile ? 'SCROLL' : 'SCROLL / DRAG'}{' '}
        <span className="arrow">{isMobile ? '↓' : '→'}</span>
      </div>

      <div className="progress">
        <div className="bar" ref={progRef} />
      </div>
    </div>
  )
}
