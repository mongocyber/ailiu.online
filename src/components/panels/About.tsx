import { Fragment } from 'react'
import { usePortfolio } from '../../portfolio-context'

export function About() {
  const { content } = usePortfolio()
  const { about } = content
  return (
    <>
      <div className="about-tag" data-depth="-60">
        {about.tag}
      </div>

      <div className="about-grid">
        <div>
          <h2 className="about-title" data-reveal data-ri="0">
            {about.titleLines.map((line, i) => (
              <Fragment key={i}>
                {line}
                <br />
              </Fragment>
            ))}
            <span className="accent">{about.titleAccent}</span>
          </h2>
          <div className="about-sub" data-reveal data-ri="1">
            {about.sub}
          </div>
        </div>

        <div className="about-col" data-reveal data-ri="2">
          <p className="about-para">{about.para}</p>
          <div className="caplist">
            {about.capabilities.map((capability) => (
              <div className="caprow" key={capability.descriptor}>
                <span className="cn">{capability.label}</span>
                <span className="en">{capability.descriptor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
