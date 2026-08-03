import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles.css'
import { Cursor } from './components/Cursor'
import { DetailOverlay } from './components/DetailOverlay'
import { Gallery } from './components/Gallery'
import type { LightboxData } from './components/Lightbox'
import { Lightbox } from './components/Lightbox'
import { ProjectPage } from './components/ProjectPage'
import { DEFAULT_LOCALE, getContent, type ProjectKey } from './content'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PortfolioContext } from './portfolio-context'
import {
  homePath,
  pageMeta,
  parsePortfolioPath,
  projectPath,
  structuredData,
} from './seo'

function setMeta(name: string, content: string) {
  const selector = `meta[name="${name}"]`
  let meta = document.head.querySelector<HTMLMetaElement>(selector)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

function setPropertyMeta(property: string, content: string) {
  const selector = `meta[property="${property}"]`
  let meta = document.head.querySelector<HTMLMetaElement>(selector)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.content = content
}

function setCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}

function setAlternate(hreflang: string, href: string) {
  let alternate = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  )
  if (!alternate) {
    alternate = document.createElement('link')
    alternate.rel = 'alternate'
    alternate.hreflang = hreflang
    document.head.appendChild(alternate)
  }
  alternate.href = href
}

function setJsonLd(locale: 'en' | 'zh', projectKey: ProjectKey | null) {
  let script = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-seo="primary"]',
  )
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'primary'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(structuredData(locale, projectKey))
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 820px)')
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [detailKey, setDetailKey] = useState<ProjectKey | null>(null)
  const [lightbox, setLightbox] = useState<LightboxData | null>(null)
  const parsedRoute = parsePortfolioPath(pathname)
  const locale = parsedRoute?.locale ?? DEFAULT_LOCALE
  const routeProject = parsedRoute?.projectKey ?? null
  const content = getContent(locale)
  const isProjectPage = routeProject !== null
  const lightboxOpen = lightbox !== null
  const mainHidden = detailKey !== null || lightboxOpen

  const openDetail = useCallback((key: ProjectKey) => setDetailKey(key), [])
  const closeDetail = useCallback(() => setDetailKey(null), [])
  const openLightbox = useCallback((data: LightboxData) => setLightbox(data), [])

  // Progressive-enhancement flag — gates the reveal-hiding CSS.
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('js')
    return () => root.classList.remove('js')
  }, [])

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (parsedRoute) return
    window.history.replaceState(null, '', '/')
    setPathname('/')
  }, [parsedRoute])

  // Drive document-scroll (mobile) vs fixed-stage (desktop) from layout mode.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('is-mobile', isMobile && !isProjectPage)
    root.classList.toggle('is-desktop', !isMobile && !isProjectPage)
    root.classList.toggle('is-project-page', isProjectPage)
  }, [isMobile, isProjectPage])

  useEffect(() => {
    const meta = pageMeta(locale, routeProject)
    document.documentElement.lang = meta.htmlLang
    document.title = meta.title
    setMeta('description', meta.description)
    setMeta('twitter:title', meta.title)
    setMeta('twitter:description', meta.description)
    setMeta('twitter:image', meta.image)
    setMeta('twitter:image:alt', meta.imageAlt)
    setPropertyMeta('og:title', meta.title)
    setPropertyMeta('og:description', meta.description)
    setPropertyMeta('og:url', meta.url)
    setPropertyMeta('og:image', meta.image)
    setPropertyMeta('og:image:alt', meta.imageAlt)
    setPropertyMeta('og:locale', meta.ogLocale)
    setPropertyMeta('og:locale:alternate', meta.alternateOgLocale)
    setCanonical(meta.url)
    meta.alternates.forEach((alternate) => setAlternate(alternate.hreflang, alternate.href))
    setJsonLd(locale, routeProject)
  }, [locale, routeProject])

  // Esc closes an open detail overlay.
  useEffect(() => {
    if (!detailKey || lightboxOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDetail()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailKey, lightboxOpen, closeDetail])

  // Lock background scroll while a modal layer is open on mobile.
  useEffect(() => {
    document.documentElement.classList.toggle(
      'detail-locked',
      Boolean(detailKey || lightboxOpen) && isMobile,
    )
  }, [detailKey, lightboxOpen, isMobile])

  const localizedProjectPath = useCallback(
    (key: ProjectKey) => projectPath(key, locale),
    [locale],
  )

  const ctx = useMemo(
    () => ({
      locale,
      content,
      routeProjectKey: routeProject,
      homePath: homePath(locale),
      projectPath: localizedProjectPath,
      openDetail,
      closeDetail,
      openLightbox,
      isMobile,
    }),
    [
      locale,
      content,
      routeProject,
      localizedProjectPath,
      openDetail,
      closeDetail,
      openLightbox,
      isMobile,
    ],
  )

  const appClass = [
    'app',
    isProjectPage ? 'is-project-page' : isMobile ? 'is-mobile' : 'is-desktop',
    fine ? 'cursor-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <PortfolioContext.Provider value={ctx}>
      <div className={appClass}>
        <div aria-hidden={mainHidden} inert={mainHidden}>
          {routeProject ? (
            <ProjectPage projectKey={routeProject} />
          ) : (
            <Gallery isMobile={isMobile} detailOpen={detailKey !== null || lightboxOpen} />
          )}
        </div>
        <DetailOverlay
          openKey={detailKey}
          onClose={closeDetail}
          onOpen={openDetail}
          modalBlocked={lightboxOpen}
        />
        <Lightbox data={lightbox} onClose={() => setLightbox(null)} />
        {fine ? <Cursor /> : null}
      </div>
    </PortfolioContext.Provider>
  )
}
