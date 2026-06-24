import { Fragment } from 'react'
import { about } from '../../content'

export function About() {
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
            {about.capabilities.map((c) => (
              <div className="caprow" key={c.en}>
                <span className="cn">{c.cn}</span>
                <span className="en">{c.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
