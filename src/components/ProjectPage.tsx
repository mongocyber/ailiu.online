import type { ProjectKey } from '../content'
import { BRAND, getProject } from '../content'
import { usePortfolio } from '../portfolio-context'
import { ProjectArticle } from './DetailOverlay'
import { LanguageSwitcher } from './LanguageSwitcher'

export function ProjectPage({ projectKey }: { projectKey: ProjectKey }) {
  const { content, homePath, locale } = usePortfolio()
  const project = getProject(locale, projectKey)

  return (
    <main className="project-page">
      <header className="project-page-bar">
        <a className="backbtn" data-cursor href={homePath}>
          <span className="accent">←</span> {content.ui.backToPortfolio}
        </a>
        <div className="header-actions">
          <LanguageSwitcher projectKey={projectKey} />
          <a className="mark" href={homePath} aria-label={content.ui.homeLabel}>
            <span className="ring" />
            {BRAND}
          </a>
        </div>
      </header>
      <ProjectArticle project={project} variant="page" />
    </main>
  )
}
