import { Fragment, useEffect, useRef, useState } from 'react'
import type { Project, ProjectKey } from '../content'
import { BRAND, projectByKey } from '../content'
import { usePortfolio } from '../portfolio-context'
import { projectPath } from '../seo'
import { Placeholder } from './Placeholder'
import { Rich } from './Rich'

interface DetailOverlayProps {
  openKey: ProjectKey | null
  onClose: () => void
  onOpen: (key: ProjectKey) => void
  modalBlocked?: boolean
}

/**
 * Full-screen detail layer that slides up from translateY(100%). Both projects
 * share one overlay; the active article persists through the close animation so
 * the slide-down stays populated.
 */
export function DetailOverlay({
  openKey,
  onClose,
  onOpen,
  modalBlocked = false,
}: DetailOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const [activeKey, setActiveKey] = useState<ProjectKey | null>(null)
  const open = openKey !== null
  const hidden = !open || modalBlocked

  useEffect(() => {
    if (openKey) {
      setActiveKey(openKey)
      if (ref.current) ref.current.scrollTop = 0
    }
  }, [openKey])

  useEffect(() => {
    if (!open) return
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }))
    return () => {
      cancelAnimationFrame(frame)
      previouslyFocused.current?.focus({ preventScroll: true })
      previouslyFocused.current = null
    }
  }, [open])

  const project = activeKey ? projectByKey[activeKey] : null

  return (
    <div
      className={`overlay${open ? ' open' : ''}`}
      ref={ref}
      role={open && !modalBlocked ? 'dialog' : undefined}
      aria-modal={open && !modalBlocked ? true : undefined}
      aria-labelledby={project && !modalBlocked ? 'detail-overlay-title' : undefined}
      aria-hidden={hidden}
      inert={hidden}
      tabIndex={open && !modalBlocked ? -1 : undefined}
    >
      <div className="backbar">
        <button className="backbtn" data-cursor onClick={onClose}>
          <span className="accent">←</span> 返回 BACK
        </button>
        <div className="mark">
          <span className="ring" />
          {BRAND}
        </div>
      </div>
      {project ? (
        <ProjectArticle
          project={project}
          onClose={onClose}
          onOpen={onOpen}
          titleId="detail-overlay-title"
        />
      ) : null}
    </div>
  )
}

export function ProjectArticle({
  project,
  onClose,
  onOpen,
  variant = 'overlay',
  titleId,
}: {
  project: Project
  onClose?: () => void
  onOpen?: (key: ProjectKey) => void
  variant?: 'overlay' | 'page'
  titleId?: string
}) {
  const { openLightbox } = usePortfolio()
  const other: ProjectKey = project.key === 'aviso' ? 'xiaoyi' : 'aviso'
  const otherLabel = project.key === 'aviso' ? '下一个项目 — 小姨家 →' : '上一个项目 — Aviso →'

  return (
    <article className="detail-wrap">
      <div className="detail-eyebrow" style={{ color: project.accent }}>
        <span className="cdot" style={{ background: project.accent }} />
        {project.detailEyebrow}
      </div>

      <h1 className="detail-title" id={titleId}>
        {project.name}
      </h1>
      <div className="detail-sub" style={{ color: project.accent }}>
        {project.detailSubtitle}
      </div>

      <p className="detail-lead">
        <Rich value={project.lead} />
      </p>

      <div className="detail-meta">
        {project.meta.map((m) => (
          <div className="meta-item" key={m.k}>
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      {project.detailCoverImage ? (
        <button
          className="detail-cover-photo zoomable"
          data-cursor
          style={project.detailCoverAspect ? { aspectRatio: project.detailCoverAspect } : undefined}
          onClick={() =>
            openLightbox({
              src: project.detailCoverImage as string,
              caption: `${project.name} · ${project.detailSubtitle}`,
            })
          }
          aria-label={`放大查看 ${project.name} 产品全景`}
        >
          <img src={project.detailCoverImage} alt={`${project.name} 产品全景`} />
          <span className="photo-zoom" aria-hidden="true">
            ⤢
          </span>
        </button>
      ) : (
        <Placeholder
          className="detail-cover"
          large
          caption={project.coverCaption}
          swatch={project.accent}
        />
      )}

      <section className="detail-section">
        <div className="overview-grid">
          <div>
            <div className="sec-kicker">01 / 概述</div>
            <h3 className="overview-title">
              {project.overviewTitle.map((line, i) => (
                <Fragment key={i}>
                  {line}
                  {i < project.overviewTitle.length - 1 ? <br /> : null}
                </Fragment>
              ))}
            </h3>
          </div>
          <div className="overview-body">
            {project.overviewBody.map((para, i) => (
              <p key={i}>
                <Rich value={para} />
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-section">
        <div className="sec-kicker">{project.listKicker}</div>
        <ol className="feature-list">
          {project.features.map((f) => (
            <li className="feature" key={f.no}>
              <span className="no" style={{ color: project.accent }}>
                {f.no}
              </span>
              <div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="detail-section">
        <div className="sec-kicker">{project.galleryKicker}</div>
        <div className="gallery-grid">
          {project.gallery.map((g, i) =>
            g.src ? (
              <button
                key={i}
                className={`gallery-fig${g.wide ? ' wide' : ''}`}
                data-cursor
                onClick={() => openLightbox({ src: g.src as string, caption: g.caption })}
                aria-label={`放大查看 ${g.caption}`}
              >
                <span className="gallery-frame" style={{ aspectRatio: g.aspect }}>
                  <img src={g.src} alt={g.caption} loading="lazy" />
                  <span className="gallery-zoom" aria-hidden="true">
                    ⤢
                  </span>
                </span>
                <span className="gallery-cap">{g.caption}</span>
              </button>
            ) : (
              <Placeholder
                key={i}
                className={g.wide ? 'wide' : undefined}
                style={{ aspectRatio: g.aspect }}
                caption={g.caption}
              />
            ),
          )}
        </div>
      </section>

      <div className="detail-footer">
        {variant === 'page' ? (
          <a className="visit" data-cursor href="/" style={{ borderBottomColor: project.accent }}>
            <span style={{ color: project.accent }}>←</span> 返回作品集 BACK
          </a>
        ) : project.externalUrl ? (
          <a
            className="visit"
            data-cursor
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderBottomColor: project.accent }}
          >
            {project.externalLabel} <span style={{ color: project.accent }}>→</span>
          </a>
        ) : onClose ? (
          <button
            className="visit"
            data-cursor
            onClick={onClose}
            style={{ borderBottomColor: project.accent, cursor: 'pointer' }}
          >
            <span style={{ color: project.accent }}>←</span> 返回作品集 BACK
          </button>
        ) : null}

        {variant === 'page' && project.externalUrl ? (
          <a
            className="nextlink"
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
          >
            {project.externalLabel} →
          </a>
        ) : null}

        {variant === 'overlay' && onOpen ? (
          <button className="nextlink" data-cursor onClick={() => onOpen(other)}>
            {otherLabel}
          </button>
        ) : (
          <a className="nextlink" data-cursor href={projectPath(other)}>
            {otherLabel}
          </a>
        )}
      </div>
    </article>
  )
}
