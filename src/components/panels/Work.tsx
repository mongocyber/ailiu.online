import type { Project } from '../../content'
import { usePortfolio } from '../../portfolio-context'
import { Placeholder } from '../Placeholder'
import { Rich } from '../Rich'

export function Work({ project }: { project: Project }) {
  const { openDetail } = usePortfolio()
  const gridClass = project.imageSide === 'right' ? 'work-grid--imgright' : 'work-grid--imgleft'
  const numSide = project.imageSide === 'right' ? 'left' : 'right'
  const ctaRi = project.tags ? 5 : 4

  return (
    <>
      <div className={`work-bignum ${numSide}`} data-depth="80">
        {project.bignum}
      </div>

      <div className={`work-grid ${gridClass}`}>
        <div className="work-text">
          <div className="work-eyebrow" data-reveal data-ri="0">
            <span className="cdot" style={{ background: project.accent }} />
            {project.eyebrow}
          </div>

          <h2 className="work-title" data-reveal data-ri="1">
            {project.name}
          </h2>

          <div className="work-sub" data-reveal data-ri="2" style={{ color: project.accent }}>
            {project.subtitle}
          </div>

          <p className="work-desc" data-reveal data-ri="3">
            <Rich value={project.desc} />
          </p>

          {project.tags ? (
            <div className="chips" data-reveal data-ri="4">
              {project.tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <button
            className="cta"
            data-reveal
            data-ri={ctaRi}
            data-cursor
            onClick={() => openDetail(project.key)}
          >
            查看项目 VIEW CASE <span className="accent">→</span>
          </button>
        </div>

        <div className="work-imgwrap" data-depth="-30">
          <Placeholder className="work-img" caption={project.cover} swatch={project.accent} />
        </div>
      </div>
    </>
  )
}
