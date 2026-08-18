import { Fragment } from 'react'
import { usePortfolio } from '../../portfolio-context'
import { IcpLink } from '../IcpLink'

export function Contact() {
  const { content } = usePortfolio()
  const { contact } = content
  return (
    <>
      <div className="contact-kicker" data-reveal data-ri="0">
        {contact.kicker}
      </div>

      <h2 className="contact-title" data-reveal data-ri="1">
        {contact.titleLines.map((line, i) => (
          <Fragment key={i}>
            {line}
            <br />
          </Fragment>
        ))}
        <span className="accent">{contact.titleAccent}</span>
      </h2>

      <p className="contact-lead" data-reveal data-ri="2">
        {contact.lead}
      </p>

      <div className="contact-links" data-reveal data-ri="3">
        {contact.links.map((link) => {
          const external = link.href.startsWith('http')
          return (
            <a
              className="clink"
              key={link.label}
              href={link.href}
              data-cursor
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <div className="label">{link.label}</div>
              <div className="val">{link.value}</div>
            </a>
          )
        })}
      </div>

      <div className="contact-footer" data-reveal data-ri="4">
        <span>{contact.footerLeft}</span>
        <IcpLink />
        <span>{contact.footerRight}</span>
      </div>
    </>
  )
}
