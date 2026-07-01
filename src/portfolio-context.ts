import { createContext, useContext } from 'react'
import type { ProjectKey } from './content'
import type { LightboxData } from './components/Lightbox'

export interface PortfolioCtx {
  openDetail: (key: ProjectKey) => void
  closeDetail: () => void
  openLightbox: (data: LightboxData) => void
  isMobile: boolean
}

export const PortfolioContext = createContext<PortfolioCtx | null>(null)

export function usePortfolio(): PortfolioCtx {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within <PortfolioContext>')
  return ctx
}
