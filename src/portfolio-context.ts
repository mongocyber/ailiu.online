import { createContext, useContext } from 'react'
import type { ProjectKey } from './content'

export interface PortfolioCtx {
  openDetail: (key: ProjectKey) => void
  closeDetail: () => void
  isMobile: boolean
}

export const PortfolioContext = createContext<PortfolioCtx | null>(null)

export function usePortfolio(): PortfolioCtx {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within <PortfolioContext>')
  return ctx
}
