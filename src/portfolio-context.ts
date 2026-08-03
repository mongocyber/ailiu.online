import { createContext, useContext } from 'react'
import type { Locale, ProjectKey, SiteContent } from './content'
import type { LightboxData } from './components/Lightbox'

export interface PortfolioCtx {
  locale: Locale
  content: SiteContent
  routeProjectKey: ProjectKey | null
  homePath: string
  projectPath: (key: ProjectKey) => string
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
