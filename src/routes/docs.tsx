import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { SiteFooter, SiteHeader } from '../components/shell/Chrome'
import { COPY, LINKS, type Locale } from '../content/site'
import { DOCS, type DocEntry } from '../content/docs'
import { usePrefs } from '../lib/prefs'
import styles from '../components/docs/Docs.module.css'

export const Route = createFileRoute('/docs')({
  head: ({ match }) => {
    const locale = match.context.locale
    return {
      meta: [
        { title: `${COPY.docs.title[locale]} | ${locale === 'ko' ? '식탁보®' : 'TableCloth®'}` },
        { name: 'description', content: COPY.docs.description[locale] },
      ],
    }
  },
  component: DocsLayout,
})

/**
 * The reference shell every /docs page shares: header, a sidebar listing
 * every doc plus the project's other outposts, and the outlet for the actual
 * page. No ClothStage here — the sandbox metaphor is the landing page's; this
 * is where a reader comes to look something up.
 *
 * Below 64rem the sidebar is not beside anything — it stacks, and the CSS
 * moves it under the article. On the index route the cards in that article
 * are the same seven links, so the stacked copy is told to stand down; on a
 * doc page it is the only way back out.
 */
function DocsLayout() {
  const { locale } = usePrefs()
  const onIndex = useRouterState({ select: (state) => state.location.pathname === '/docs' })

  return (
    <>
      <a className="app-skip-link" href="#main">
        {COPY.nav.skip[locale]}
      </a>
      <SiteHeader locale={locale} />
      <div className={`${styles.layout} app-shell`}>
        <nav
          className={styles.sidebar}
          data-index={onIndex || undefined}
          aria-label={COPY.docs.pagesLabel[locale]}
        >
          <p className={styles.sidebarTitle} data-docs>
            {COPY.docs.pagesLabel[locale]}
          </p>
          <ul className={styles.sidebarList} data-docs>
            {DOCS.map((doc) => (
              <DocsSidebarItem key={doc.slug} doc={doc} locale={locale} />
            ))}
          </ul>

          <p className={styles.sidebarTitle}>{COPY.docs.elsewhereLabel[locale]}</p>
          <ul className={styles.sidebarList}>
            <li className={styles.sidebarItem}>
              <a className={styles.sidebarExternal} href={LINKS.lite} target="_blank" rel="noopener">
                {COPY.docs.lite[locale]}
              </a>
              <span className={styles.sidebarExternalNote}>{COPY.docs.liteDescription[locale]}</span>
            </li>
            <li className={styles.sidebarItem}>
              <a className={styles.sidebarExternal} href={LINKS.catalogBrowser} target="_blank" rel="noopener">
                {COPY.docs.catalogLink[locale]}
              </a>
            </li>
            <li className={styles.sidebarItem}>
              <a className={styles.sidebarExternal} href={LINKS.github} target="_blank" rel="noopener">
                GitHub
              </a>
            </li>
            <li className={styles.sidebarItem}>
              <a className={styles.sidebarExternal} href={LINKS.discord} target="_blank" rel="noopener">
                Discord
              </a>
            </li>
          </ul>

          <Link className={styles.backLink} to="/">
            {COPY.docs.backHome[locale]}
          </Link>
        </nav>

        <main id="main" className={styles.content}>
          <Outlet />
        </main>
      </div>
      <SiteFooter locale={locale} />
    </>
  )
}

/** TanStack's Link sets `data-status`/`aria-current="page"` itself once this slug is current. */
function DocsSidebarItem({ doc, locale }: { doc: DocEntry; locale: Locale }) {
  const badge = doc.badge?.[locale]

  return (
    <li className={styles.sidebarItem}>
      <Link className={styles.sidebarLink} to="/docs/$slug" params={{ slug: doc.slug }}>
        {badge ? (
          <span className={styles.sidebarBadge}>{badge}</span>
        ) : null}
        {doc.title[locale]}
      </Link>
    </li>
  )
}
