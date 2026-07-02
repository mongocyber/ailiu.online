import {
  about,
  BRAND,
  hero,
  projectByKey,
  projects,
  type Project,
  type ProjectKey,
} from './content.ts'

export const SITE_URL = 'https://ailiu.online'
export const HOME_URL = `${SITE_URL}/`
export const DEFAULT_OG_IMAGE = `${SITE_URL}/aviso/aviso-product.jpg`
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`
const PORTFOLIO_ID = `${SITE_URL}/#portfolio`

export interface PageMeta {
  title: string
  description: string
  url: string
  image: string
  imageAlt: string
}

export const projectPath = (key: ProjectKey) => `/projects/${key}`

const fullUrl = (path: string) => `${SITE_URL}${path}`

const projectImage = (project: Project) =>
  project.detailCoverImage || project.coverImage
    ? `${SITE_URL}${project.detailCoverImage || project.coverImage}`
    : DEFAULT_OG_IMAGE

const projectImageAlt = (project: Project) => `${project.name} ${project.coverCaption}`

export function projectDescription(project: Project) {
  return project.lead.text || project.desc.text
}

export function pageMeta(projectKey?: ProjectKey | null): PageMeta {
  if (!projectKey) {
    return {
      title: 'ailiu — Designer & AI Builder · 个人作品集',
      description: hero.lead,
      url: HOME_URL,
      image: DEFAULT_OG_IMAGE,
      imageAlt: `${BRAND} 个人作品集中的 Aviso 产品界面`,
    }
  }

  const project = projectByKey[projectKey]
  return {
    title: `${project.name} — ailiu 作品案例`,
    description: projectDescription(project),
    url: fullUrl(projectPath(projectKey)),
    image: projectImage(project),
    imageAlt: projectImageAlt(project),
  }
}

const yearForProject = (project: Project) => project.meta.find((item) => item.k === 'YEAR')?.v
const platformForProject = (project: Project) => project.meta.find((item) => item.k === 'PLATFORM')?.v
const typeForProject = (project: Project) => project.meta.find((item) => item.k === 'TYPE')?.v
const roleForProject = (project: Project) => project.meta.find((item) => item.k === 'ROLE')?.v

const personSchema = () => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: BRAND,
  url: HOME_URL,
  jobTitle: 'Designer & AI Builder',
  sameAs: ['https://github.com/mongocyber'],
  knowsAbout: about.capabilities.map((capability) => capability.en),
})

const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: BRAND,
  url: HOME_URL,
  inLanguage: 'zh-CN',
  author: { '@id': PERSON_ID },
  description: hero.lead,
})

const creativeWorkSchema = (project: Project, position?: number) => ({
  '@type': 'CreativeWork',
  '@id': `${fullUrl(projectPath(project.key))}#creative-work`,
  ...(position ? { position } : {}),
  name: project.name,
  url: fullUrl(projectPath(project.key)),
  image: projectImage(project),
  creator: { '@id': PERSON_ID },
  inLanguage: 'zh-CN',
  description: projectDescription(project),
  keywords: Array.from(new Set([
    project.detailEyebrow,
    project.subtitle,
    ...(project.tags ?? []),
    ...project.features.map((feature) => feature.title),
  ])),
  ...(yearForProject(project) ? { dateCreated: yearForProject(project) } : {}),
  ...(roleForProject(project) ? { creditText: roleForProject(project) } : {}),
  ...(platformForProject(project) || typeForProject(project)
    ? { about: platformForProject(project) || typeForProject(project) }
    : {}),
})

const portfolioSchema = () => ({
  '@type': 'ItemList',
  '@id': PORTFOLIO_ID,
  name: `${BRAND} portfolio projects`,
  itemListElement: projects.map((project, index) => creativeWorkSchema(project, index + 1)),
})

const breadcrumbSchema = (project: Project) => ({
  '@type': 'BreadcrumbList',
  '@id': `${fullUrl(projectPath(project.key))}#breadcrumb`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: BRAND,
      item: HOME_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: project.name,
      item: fullUrl(projectPath(project.key)),
    },
  ],
})

export function structuredData(projectKey?: ProjectKey | null) {
  const graph: unknown[] = [personSchema(), websiteSchema()]

  if (projectKey) {
    const project = projectByKey[projectKey]
    graph.push(creativeWorkSchema(project), breadcrumbSchema(project))
  } else {
    graph.push(portfolioSchema())
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function jsonLdScript(projectKey?: ProjectKey | null) {
  const json = JSON.stringify(structuredData(projectKey), null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json" data-seo="primary">\n${json}\n</script>`
}

const escapeHtmlText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export function applyStaticSeo(html: string, projectKey?: ProjectKey | null) {
  const meta = pageMeta(projectKey)
  const title = escapeHtmlText(meta.title)
  const description = escapeHtmlText(meta.description)
  const url = escapeHtmlText(meta.url)
  const image = escapeHtmlText(meta.image)
  const imageAlt = escapeHtmlText(meta.imageAlt)

  let output = html
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

  const script = jsonLdScript(projectKey)
  if (output.includes('<!-- seo:jsonld -->')) {
    output = output.replace('<!-- seo:jsonld -->', script)
  } else {
    output = output.replace(
      /<script type="application\/ld\+json" data-seo="primary">[\s\S]*?<\/script>/,
      script,
    )
  }

  return output
}
