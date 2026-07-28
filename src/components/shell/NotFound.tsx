import { useState } from 'react'

import { Link } from '@tanstack/react-router'

import { COPY } from '../../content/site'
import { usePrefs } from '../../lib/prefs'
import { SiteFooter, SiteHeader } from './Chrome'
import styles from './NotFound.module.css'

/**
 * Every route that does not exist.
 *
 * Registered on the root route, so it is what a mistyped path, a stale link
 * from anywhere, and an unknown `/docs/<slug>` all land on. It wears the site's
 * own header and footer rather than standing alone: a reader who arrives here
 * has already lost the thread, and the one thing that reliably tells them they
 * are still on the right site is the chrome they were looking at a moment ago.
 *
 * Locale comes from `usePrefs` like everywhere else, so the copy matches the
 * cookie the server already resolved — a 404 that answers in the wrong language
 * is the second thing to go wrong in a row.
 *
 * It also carries the page's one interaction: a small cloth over an empty
 * place setting, lifted the same way the hero's own sheet is. Awwwards'
 * write-up on trionn.com's 404 names a broken link as an Element in its own
 * right specifically because it does something rather than stopping dead,
 * and usability — not craft — is the category real Site of the Day winners
 * keep losing points on. The corner only ever confirms what the heading
 * already says: lift it and there is nothing underneath.
 */
export function NotFound() {
  const { locale } = usePrefs()
  /*
   * Hover on a real pointer previews the lift; a tap, or Enter/Space once
   * focused, pins it — a coarse pointer never fires `:hover`, and a flash on
   * touchend is not something a first-time visitor gets a chance to notice.
   * Nothing downstream reads this; it only ever drives the cloth's own
   * clip-path in CSS.
   */
  const [peeked, setPeeked] = useState(false)

  return (
    <>
      <a className="app-skip-link" href="#main">
        {COPY.nav.skip[locale]}
      </a>
      <SiteHeader locale={locale} />
      <main id="main" className={styles.root}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{COPY.notFound.eyebrow[locale]}</p>
          <h1 className={styles.title}>{COPY.notFound.title[locale]}</h1>
          <p className={styles.body}>{COPY.notFound.body[locale]}</p>
          <div className={styles.actions}>
            <Link className={styles.cta} to="/">
              {COPY.notFound.home[locale]}
            </Link>
            <Link className={styles.link} to="/docs">
              {COPY.notFound.docs[locale]}
            </Link>
          </div>
          <div className={styles.setting}>
            <div className={styles.plate} aria-hidden="true" />
            <div className={styles.utensil} data-side="fork" aria-hidden="true" />
            <div className={styles.utensil} data-side="knife" aria-hidden="true" />
            <button
              type="button"
              className={styles.cloth}
              aria-pressed={peeked}
              aria-label={COPY.notFound.peek[locale]}
              onClick={() => setPeeked((value) => !value)}
              data-peek={peeked || undefined}
            />
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
