import { LANGUAGE_OPTIONS, type ProjectKey } from '../content'
import { usePortfolio } from '../portfolio-context'
import { HTML_LANG, localizedPath } from '../seo'

export function LanguageSwitcher({ projectKey }: { projectKey?: ProjectKey | null }) {
  const { locale, content, routeProjectKey } = usePortfolio()
  const currentProject = projectKey === undefined ? routeProjectKey : projectKey
  const options = [
    {
      locale: 'en' as const,
      shortLabel: LANGUAGE_OPTIONS.en.shortLabel,
      label: content.ui.englishLanguage,
    },
    {
      locale: 'zh' as const,
      shortLabel: LANGUAGE_OPTIONS.zh.shortLabel,
      label: content.ui.chineseLanguage,
    },
  ]

  return (
    <nav className="language-switcher" aria-label={content.ui.languageSwitcherLabel}>
      {options.map((option, index) => {
        const current = option.locale === locale
        const ariaLabel = current
          ? `${option.label}, ${content.ui.currentLanguage}`
          : content.ui.switchToLanguage(option.label)
        return (
          <span className="language-item" key={option.locale}>
            {index > 0 ? (
              <span className="language-separator" aria-hidden="true">
                /
              </span>
            ) : null}
            <a
              className="language-option"
              href={localizedPath(option.locale, currentProject)}
              hrefLang={HTML_LANG[option.locale]}
              aria-current={current ? 'page' : undefined}
              aria-label={ariaLabel}
              data-cursor
            >
              <span lang={HTML_LANG[option.locale]}>{option.shortLabel}</span>
            </a>
          </span>
        )
      })}
    </nav>
  )
}
