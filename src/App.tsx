import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles.css'
import type { ProjectKey } from './content'
import { Cursor } from './components/Cursor'
import { DetailOverlay } from './components/DetailOverlay'
import { Gallery } from './components/Gallery'
import { VectorField } from './components/VectorField'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PortfolioContext } from './portfolio-context'

export default function App() {
  const isMobile = useMediaQuery('(max-width: 820px)')
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [detailKey, setDetailKey] = useState<ProjectKey | null>(null)

  const openDetail = useCallback((key: ProjectKey) => setDetailKey(key), [])
  const closeDetail = useCallback(() => setDetailKey(null), [])

  // Progressive-enhancement flag — gates the reveal-hiding CSS.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('js')
    return () => root.classList.remove('js')
  }, [])

  // Drive document-scroll (mobile) vs fixed-stage (desktop) from layout mode.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('is-mobile', isMobile)
    root.classList.toggle('is-desktop', !isMobile)
  }, [isMobile])

  // Esc closes an open detail overlay.
  useEffect(() => {
    if (!detailKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailKey, closeDetail])

  // Lock background scroll while a detail overlay is open on mobile.
  useEffect(() => {
    document.documentElement.classList.toggle('detail-locked', Boolean(detailKey) && isMobile)
  }, [detailKey, isMobile])

  const ctx = useMemo(
    () => ({ openDetail, closeDetail, isMobile }),
    [openDetail, closeDetail, isMobile],
  )

  const appClass = ['app', isMobile ? 'is-mobile' : 'is-desktop', fine ? 'cursor-hidden' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <PortfolioContext.Provider value={ctx}>
      <div className={appClass}>
        <VectorField />
        <Gallery isMobile={isMobile} detailOpen={detailKey !== null} />
        <DetailOverlay openKey={detailKey} onClose={closeDetail} onOpen={openDetail} />
        {fine ? <Cursor /> : null}
      </div>
    </PortfolioContext.Provider>
  )
}
