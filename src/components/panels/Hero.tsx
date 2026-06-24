import { Fragment } from 'react'
import { hero } from '../../content'

export function Hero() {
  return (
    <>
      <div className="hero-coords" data-depth="34">
        {hero.coords.map((line, i) => (
          <Fragment key={i}>
            {line}
            {i < hero.coords.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </div>

      <div className="hero-kicker" data-reveal data-ri="0">
        <span className="blink" />
        {hero.kicker}
      </div>

      <h1 className="hero-title" data-reveal data-ri="1">
        {hero.titleLines.map((line, i) => (
          <Fragment key={i}>
            {line}
            <br />
          </Fragment>
        ))}
        <span className="accent">{hero.titleAccent}</span>
      </h1>

      <p className="hero-lead" data-reveal data-ri="2">
        {hero.lead}
      </p>
    </>
  )
}
