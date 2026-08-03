import {
  BRAND,
  DEFAULT_LOCALE,
  getContent,
  getProject,
  LANGUAGE_OPTIONS,
  LOCALES,
  PROJECT_KEYS,
  type Locale,
  type Project,
  type ProjectKey,
} from './content.ts'

export const SITE_URL = 'https://ailiu.online'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/aviso/aviso-product.jpg`
const PERSON_ID = `${SITE_URL}/#person`

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
}

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
}

export interface PortfolioRoute {
  locale: Locale
  projectKey: ProjectKey | null
}

export interface StaticPage extends PortfolioRoute {
  pathname: string
  outputPath: string
}

export interface PageMeta {
  locale: Locale
  htmlLang: string
  ogLocale: string
  alternateOgLocale: string
  title: string
  description: string
  pathname: string
  url: string
  image: string
  imageAlt: string
  alternates: { hreflang: 'en' | 'zh-CN' | 'x-default'; href: string }[]
}

const projectKeySet = new Set<ProjectKey>(PROJECT_KEYS)

export const homePath = (locale: Locale) => (locale === 'en' ? '/' : '/zh')

export const projectPath = (key: ProjectKey, locale: Locale = DEFAULT_LOCALE) =>
  `${locale === 'zh' ? '/zh' : ''}/projects/${key}`

export const localizedPath = (locale: Locale, projectKey?: ProjectKey | null) =>
  projectKey ? projectPath(projectKey, locale) : homePath(locale)

export function parsePortfolioPath(pathname: string): PortfolioRoute | null {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  if (normalized === '/') return { locale: 'en', projectKey: null }
  if (normalized === '/zh') return { locale: 'zh', projectKey: null }

  const match = normalized.match(/^\/(zh\/)?projects\/([^/]+)$/)
  if (!match) return null
  const key = match[2] as ProjectKey
  if (!projectKeySet.has(key)) return null
  return { locale: match[1] ? 'zh' : 'en', projectKey: key }
}

export const STATIC_PAGES: StaticPage[] = LOCALES.flatMap((locale) => [
  {
    locale,
    projectKey: null,
    pathname: homePath(locale),
    outputPath: locale === 'en' ? 'index.html' : 'zh/index.html',
  },
  ...PROJECT_KEYS.map((projectKey) => ({
    locale,
    projectKey,
    pathname: projectPath(projectKey, locale),
    outputPath:
      locale === 'en'
        ? `projects/${projectKey}/index.html`
        : `zh/projects/${projectKey}/index.html`,
  })),
])

const fullUrl = (path: string) => `${SITE_URL}${path}`

const projectImage = (project: Project) =>
  project.detailCoverImage || project.coverImage
    ? `${SITE_URL}${project.detailCoverImage || project.coverImage}`
    : DEFAULT_OG_IMAGE

export function pageMeta(locale: Locale, projectKey?: ProjectKey | null): PageMeta {
  const content = getContent(locale)
  const pathname = localizedPath(locale, projectKey)
  const englishUrl = fullUrl(localizedPath('en', projectKey))
  const chineseUrl = fullUrl(localizedPath('zh', projectKey))

  if (!projectKey) {
    return {
      locale,
      htmlLang: HTML_LANG[locale],
      ogLocale: OG_LOCALE[locale],
      alternateOgLocale: OG_LOCALE[locale === 'en' ? 'zh' : 'en'],
      title: content.seo.homeTitle,
      description: content.seo.homeDescription,
      pathname,
      url: fullUrl(pathname),
      image: DEFAULT_OG_IMAGE,
      imageAlt: content.seo.homeImageAlt,
      alternates: [
        { hreflang: 'en', href: englishUrl },
        { hreflang: 'zh-CN', href: chineseUrl },
        { hreflang: 'x-default', href: englishUrl },
      ],
    }
  }

  const project = getProject(locale, projectKey)
  return {
    locale,
    htmlLang: HTML_LANG[locale],
    ogLocale: OG_LOCALE[locale],
    alternateOgLocale: OG_LOCALE[locale === 'en' ? 'zh' : 'en'],
    title: project.seoTitle,
    description: project.seoDescription,
    pathname,
    url: fullUrl(pathname),
    image: projectImage(project),
    imageAlt: project.detailCoverAlt,
    alternates: [
      { hreflang: 'en', href: englishUrl },
      { hreflang: 'zh-CN', href: chineseUrl },
      { hreflang: 'x-default', href: englishUrl },
    ],
  }
}

const yearForProject = (project: Project) =>
  project.meta.find((item) => /^\d{4}$/.test(item.v))?.v

const personSchema = (locale: Locale) => {
  const content = getContent(locale)
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: BRAND,
    url: fullUrl(homePath(locale)),
    jobTitle: content.seo.jobTitle,
    sameAs: ['https://github.com/mongocyber'],
    knowsAbout: content.about.capabilities.map((capability) => capability.label),
  }
}

const websiteSchema = (locale: Locale) => {
  const content = getContent(locale)
  const url = fullUrl(homePath(locale))
  return {
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: BRAND,
    url,
    inLanguage: HTML_LANG[locale],
    author: { '@id': PERSON_ID },
    description: content.seo.homeDescription,
  }
}

const creativeWorkSchema = (locale: Locale, project: Project, position?: number) => {
  const url = fullUrl(projectPath(project.key, locale))
  return {
    '@type': 'CreativeWork',
    '@id': `${url}#creative-work`,
    ...(position ? { position } : {}),
    name: project.name,
    url,
    image: projectImage(project),
    creator: { '@id': PERSON_ID },
    inLanguage: HTML_LANG[locale],
    description: project.seoDescription,
    keywords: Array.from(
      new Set([
        project.detailEyebrow,
        project.subtitle,
        ...(project.tags ?? []),
        ...project.features.map((feature) => feature.title),
      ]),
    ),
    ...(yearForProject(project) ? { dateCreated: yearForProject(project) } : {}),
    ...(project.meta[0]?.v ? { creditText: project.meta[0].v } : {}),
    ...(project.meta[2]?.v ? { about: project.meta[2].v } : {}),
  }
}

const portfolioSchema = (locale: Locale) => {
  const content = getContent(locale)
  const url = fullUrl(homePath(locale))
  return {
    '@type': 'ItemList',
    '@id': `${url}#portfolio`,
    name: content.seo.portfolioName,
    itemListElement: content.projects.map((project, index) =>
      creativeWorkSchema(locale, project, index + 1),
    ),
  }
}

const breadcrumbSchema = (locale: Locale, project: Project) => {
  const projectUrl = fullUrl(projectPath(project.key, locale))
  return {
    '@type': 'BreadcrumbList',
    '@id': `${projectUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: BRAND,
        item: fullUrl(homePath(locale)),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: project.name,
        item: projectUrl,
      },
    ],
  }
}

export function structuredData(locale: Locale, projectKey?: ProjectKey | null) {
  const graph: unknown[] = [personSchema(locale), websiteSchema(locale)]

  if (projectKey) {
    const project = getProject(locale, projectKey)
    graph.push(creativeWorkSchema(locale, project), breadcrumbSchema(locale, project))
  } else {
    graph.push(portfolioSchema(locale))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function jsonLdScript(locale: Locale, projectKey?: ProjectKey | null) {
  const json = JSON.stringify(structuredData(locale, projectKey), null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json" data-seo="primary">\n${json}\n</script>`
}

const escapeHtmlText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const richTextHtml = (value: { text: string; muted?: string }) =>
  `${escapeHtmlText(value.text)}${value.muted ? ` <span>${escapeHtmlText(value.muted)}</span>` : ''}`

const languageLinksHtml = (locale: Locale, projectKey?: ProjectKey | null) => {
  const content = getContent(locale)
  return `<nav aria-label="${escapeHtmlText(content.ui.languageSwitcherLabel)}">
  <a href="${localizedPath('en', projectKey)}" hreflang="en" lang="en">${escapeHtmlText(LANGUAGE_OPTIONS.en.shortLabel)}</a>
  <span aria-hidden="true"> / </span>
  <a href="${localizedPath('zh', projectKey)}" hreflang="zh-CN" lang="zh-CN">${escapeHtmlText(LANGUAGE_OPTIONS.zh.shortLabel)}</a>
</nav>`
}

function homeFallback(locale: Locale) {
  const content = getContent(locale)
  return `<main class="static-fallback">
  ${languageLinksHtml(locale)}
  <header>
    <p>${escapeHtmlText(content.hero.kicker)}</p>
    <h1>${content.hero.titleLines.map(escapeHtmlText).join('<br />')}<br />${escapeHtmlText(content.hero.titleAccent)}</h1>
    <p>${escapeHtmlText(content.hero.lead)}</p>
  </header>
  <section>
    <p>${escapeHtmlText(content.about.tag)}</p>
    <h2>${content.about.titleLines.map(escapeHtmlText).join('<br />')}<br />${escapeHtmlText(content.about.titleAccent)}</h2>
    <p>${escapeHtmlText(content.about.para)}</p>
    <ul>${content.about.capabilities
      .map(
        (capability) =>
          `<li>${escapeHtmlText(capability.label)} — ${escapeHtmlText(capability.descriptor)}</li>`,
      )
      .join('')}</ul>
  </section>
  ${content.projects
    .map(
      (project) => `<section>
    <p>${escapeHtmlText(project.eyebrow)}</p>
    <h2>${escapeHtmlText(project.name)}</h2>
    <p>${escapeHtmlText(project.subtitle)}</p>
    <p>${richTextHtml(project.desc)}</p>
    ${project.coverImage ? `<img src="${project.coverImage}" alt="${escapeHtmlText(project.coverAlt)}" />` : ''}
    <p><a href="${projectPath(project.key, locale)}">${escapeHtmlText(content.ui.viewCase)} — ${escapeHtmlText(project.name)}</a></p>
  </section>`,
    )
    .join('\n  ')}
  <section>
    <p>${escapeHtmlText(content.contact.kicker)}</p>
    <h2>${content.contact.titleLines.map(escapeHtmlText).join('<br />')}<br />${escapeHtmlText(content.contact.titleAccent)}</h2>
    <p>${escapeHtmlText(content.contact.lead)}</p>
    <ul>${content.contact.links
      .map(
        (link) =>
          `<li><a href="${escapeHtmlText(link.href)}">${escapeHtmlText(link.label)}: ${escapeHtmlText(link.value)}</a></li>`,
      )
      .join('')}</ul>
  </section>
</main>`
}

function projectFallback(locale: Locale, projectKey: ProjectKey) {
  const content = getContent(locale)
  const project = getProject(locale, projectKey)
  return `<main class="static-fallback">
  ${languageLinksHtml(locale, projectKey)}
  <p><a href="${homePath(locale)}">${escapeHtmlText(content.ui.backToPortfolio)}</a></p>
  <article>
    <p>${escapeHtmlText(project.detailEyebrow)}</p>
    <h1>${escapeHtmlText(project.name)}</h1>
    <p>${escapeHtmlText(project.detailSubtitle)}</p>
    <p>${richTextHtml(project.lead)}</p>
    <dl>${project.meta
      .map(
        (item) =>
          `<div><dt>${escapeHtmlText(item.k)}</dt><dd>${escapeHtmlText(item.v)}</dd></div>`,
      )
      .join('')}</dl>
    ${project.detailCoverImage ? `<img src="${project.detailCoverImage}" alt="${escapeHtmlText(project.detailCoverAlt)}" />` : ''}
    <section>
      <p>${escapeHtmlText(content.ui.overviewKicker)}</p>
      <h2>${project.overviewTitle.map(escapeHtmlText).join('<br />')}</h2>
      ${project.overviewBody.map((paragraph) => `<p>${richTextHtml(paragraph)}</p>`).join('')}
    </section>
    <section>
      <h2>${escapeHtmlText(project.listKicker)}</h2>
      <ol>${project.features
        .map(
          (feature) =>
            `<li><h3>${escapeHtmlText(feature.title)}</h3><p>${escapeHtmlText(feature.desc)}</p></li>`,
        )
        .join('')}</ol>
    </section>
    <section>
      <h2>${escapeHtmlText(project.galleryKicker)}</h2>
      ${project.gallery
        .map(
          (image) =>
            image.src
              ? `<figure><img src="${image.src}" alt="${escapeHtmlText(image.alt)}" /><figcaption>${escapeHtmlText(image.caption)}</figcaption></figure>`
              : `<p>${escapeHtmlText(image.caption)}</p>`,
        )
        .join('')}
    </section>
    ${project.externalUrl && project.externalLabel ? `<p><a href="${project.externalUrl}">${escapeHtmlText(project.externalLabel)}</a></p>` : ''}
  </article>
</main>`
}

export function staticFallback(locale: Locale, projectKey?: ProjectKey | null) {
  const content = projectKey ? projectFallback(locale, projectKey) : homeFallback(locale)
  return `<noscript data-static-content>\n${content}\n</noscript>`
}

const replaceOrInsertHead = (html: string, pattern: RegExp, replacement: string) =>
  pattern.test(html) ? html.replace(pattern, replacement) : html.replace('</head>', `  ${replacement}\n  </head>`)

export function applyStaticSeo(
  html: string,
  locale: Locale = DEFAULT_LOCALE,
  projectKey?: ProjectKey | null,
) {
  const meta = pageMeta(locale, projectKey)
  const title = escapeHtmlText(meta.title)
  const description = escapeHtmlText(meta.description)
  const url = escapeHtmlText(meta.url)
  const image = escapeHtmlText(meta.image)
  const imageAlt = escapeHtmlText(meta.imageAlt)

  let output = html
    .replace(/<html\s+lang="[^"]*">/, `<html lang="${meta.htmlLang}">`)
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${url}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${url}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${image}" />`,
    )
    .replace(
      /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:image:alt" content="${imageAlt}" />`,
    )
    .replace(
      /<meta\s+property="og:locale"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:locale" content="${meta.ogLocale}" />`,
    )
    .replace(
      /<meta\s+property="og:locale:alternate"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:locale:alternate" content="${meta.alternateOgLocale}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:image" content="${image}" />`,
    )
    .replace(
      /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:image:alt" content="${imageAlt}" />`,
    )

  const alternateBlock = `<!-- seo:alternates:start -->\n${meta.alternates
    .map(
      (alternate) =>
        `    <link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeHtmlText(alternate.href)}" />`,
    )
    .join('\n')}\n    <!-- seo:alternates:end -->`
  output = replaceOrInsertHead(
    output,
    /<!-- seo:alternates:start -->[\s\S]*?<!-- seo:alternates:end -->/,
    alternateBlock,
  )

  const script = jsonLdScript(locale, projectKey)
  if (output.includes('<!-- seo:jsonld -->')) {
    output = output.replace('<!-- seo:jsonld -->', script)
  } else {
    output = output.replace(
      /<script type="application\/ld\+json" data-seo="primary">[\s\S]*?<\/script>/,
      script,
    )
  }

  const fallback = staticFallback(locale, projectKey)
  if (output.includes('<!-- seo:static-content -->')) {
    output = output.replace('<!-- seo:static-content -->', fallback)
  } else if (/<noscript data-static-content>[\s\S]*?<\/noscript>/.test(output)) {
    output = output.replace(/<noscript data-static-content>[\s\S]*?<\/noscript>/, fallback)
  } else {
    output = output.replace('<div id="root"></div>', `<div id="root"></div>\n    ${fallback}`)
  }

  return output
}
