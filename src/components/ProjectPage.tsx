import type { ProjectKey } from '../content'
import { BRAND, projectByKey } from '../content'
import { ProjectArticle } from './DetailOverlay'

export function ProjectPage({ projectKey }: { projectKey: ProjectKey }) {
  const project = projectByKey[projectKey]

  return (
    <main className="project-page">
      <header className="project-page-bar">
        <a className="backbtn" data-cursor href="/">
          <span className="accent">←</span> 返回作品集 BACK
        </a>
        <a className="mark" href="/" aria-label={`${BRAND} 首页`}>
          <span className="ring" />
          {BRAND}
        </a>
      </header>
      <ProjectArticle project={project} variant="page" />
    </main>
  )
}
