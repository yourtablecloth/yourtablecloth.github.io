import { useEffect, useRef, useState } from 'react'

import { Link, useRouterState } from '@tanstack/react-router'

import { COPY, LINKS, type Locale } from '../../content/site'
import { usePrefs } from '../../lib/prefs'
import { Mark } from './Mark'
import styles from './Chrome.module.css'

/**
 * Site chrome: header and footer.
 *
 * Everything between them argues the case with type, data, and one cloth.
 * The chrome's whole job is to get out of the way — a slim translucent bar
 * that never competes with the hero, and a quiet close that never competes
 * with the argument that preceded it. See Chrome.module.css for why it is
 * styled so much plainer than the sections it wraps.
 */

const NAV_SECTIONS = ['under', 'how', 'project'] as const
/**
 * The header's running-commentary line (see the caption block in the JSX
 * below, and Chrome.module.css). `'top'` stands for everything before the
 * reader reaches the first tracked section — the hero and the reveal —
 * which is the same span of the page where `active` itself is still `null`.
 */
const CAPTION_KEYS = ['top', ...NAV_SECTIONS] as const
/**
 * `to="/"` matches by prefix by default, so every one of these links would
 * claim `aria-current="page"` on /docs and on a bare `/` alike. Exact path
 * plus hash narrows it to the one target actually being pointed at.
 */
const HASH_EXACT = { exact: true, includeHash: true } as const

export function SiteHeader({ locale }: { locale: Locale }) {
  const { theme, setLocale, setTheme } = usePrefs()
  const header = useRef<HTMLElement>(null)
  // The section anchors only exist on the landing page, so the "which one am
  // I in" readout has to be route-aware too — on /docs there is nothing to be
  // in, and marking one current there would be a lie.
  const onHome = useRouterState({ select: (state) => state.location.pathname === '/' })
  const [active, setActive] = useState<string | null>(null)
  // `active` is one of NAV_SECTIONS or null; this just resolves it to the
  // key CAPTION_KEYS actually indexes, `top` standing in for "nothing yet".
  const captionKey = active ?? 'top'

  // Plain scroll state, not a GSAP reveal: the header doesn't enter, it just
  // gets denser once the hero has scrolled by, and marks whichever section the
  // reader has reached. CSS transitions do the actual visual work; this only
  // ever writes the one attribute they key off.
  useEffect(() => {
    const element = header.current
    if (!element) return

    const onScroll = () => {
      if (window.scrollY > window.innerHeight) {
        element.dataset.scrolled = 'true'
      } else {
        delete element.dataset.scrolled
      }

      if (!onHome) return
      // Last section whose top has passed under the bar wins, so the readout
      // changes exactly when the heading tucks behind the header rather than
      // when some arbitrary fraction of the section is on screen.
      let current: string | null = null
      for (const section of NAV_SECTIONS) {
        const node = document.getElementById(section)
        if (node && node.getBoundingClientRect().top <= element.offsetHeight + 8) current = section
      }
      setActive((previous) => (previous === current ? previous : current))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onHome])

  return (
    <header ref={header} className={styles.header}>
      <div className={styles.inner}>
        {/*
         * A router Link, not a bare `#main`. The chrome is shared with /docs,
         * where a hash-only href resolves against the docs page — the wordmark
         * scrolled you to the docs body instead of taking you home, and the
         * section anchors below pointed at ids that do not exist there at all.
         * Every one of them now names the route it belongs to.
         */}
        <Link
          className={styles.home}
          to="/"
          hash="main"
          activeOptions={HASH_EXACT}
          aria-label={COPY.nav.home[locale]}
        >
          <Mark size={22} />
          <span>{locale === 'ko' ? '식탁보®' : 'TableCloth®'}</span>
        </Link>

        <nav className={styles.nav} aria-label={COPY.nav.label[locale]}>
          <ul className={styles.navList}>
            {NAV_SECTIONS.map((section) => (
              <li key={section}>
                <Link
                  to="/"
                  hash={section}
                  activeOptions={HASH_EXACT}
                  data-current={onHome && active === section ? 'true' : undefined}
                  aria-current={onHome && active === section ? 'true' : undefined}
                >
                  {COPY.nav.sections[section][locale]}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/docs">{COPY.nav.docs[locale]}</Link>
            </li>
          </ul>
        </nav>

        {/*
         * The running-commentary line: same `active` state that underlines
         * the nav item, read as a sentence instead of a label. Mounted only
         * on the landing page — off it there is no section to report on, and
         * showing the top-of-page line over /docs would describe a page that
         * is not there.
         *
         * All four candidates render at once, stacked in one grid cell (the
         * same technique Hero.tsx uses for its own reveal captions), so the
         * box never resizes when the active one changes — only the opacity
         * of whichever span matches `data-active` moves, which is what reads
         * as a crossfade instead of a layout shift. `aria-hidden` plus
         * `aria-live="off"` is belt and suspenders (see Tally.tsx): the
         * section headings already carry this information, so having a
         * screen reader repeat it on every scroll tick would be pure noise.
         */}
        {onHome && (
          <p className={styles.caption} aria-hidden="true" aria-live="off">
            {CAPTION_KEYS.map((key) => (
              <span key={key} data-active={captionKey === key ? 'true' : undefined}>
                {COPY.headerCaption[key][locale]}
              </span>
            ))}
          </p>
        )}

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.control}
            aria-label={COPY.nav.langAria[locale]}
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
          >
            {COPY.nav.lang[locale]}
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label={theme === 'dark' ? COPY.nav.theme[locale] : COPY.nav.themeDark[locale]}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className={styles.footer}>
      <Mark size={220} className={styles.flourish} />

      <div className={styles.footerInner}>
        <p className={styles.tagline}>{COPY.footer.tagline[locale]}</p>

        <div className={styles.links}>
          {/*
           * The header's section nav is display:none below 48rem, and it is
           * the only other place /docs is linked by name — on a phone the
           * reference section was reachable only by guessing at a card link
           * three sections down. It belongs in the one link row that is
           * always present.
           */}
          <Link className={styles.link} to="/docs">
            {COPY.nav.docs[locale]}
          </Link>
          <a className={styles.link} href={LINKS.github} target="_blank" rel="noopener">
            GitHub
          </a>
          <a className={styles.link} href={LINKS.releases} target="_blank" rel="noopener">
            {COPY.hero.install[locale]}
          </a>
          <a className={styles.link} href={LINKS.catalog} target="_blank" rel="noopener">
            {COPY.project.catalogLink[locale]}
          </a>
          <a className={styles.link} href={LINKS.discord} target="_blank" rel="noopener">
            Discord
          </a>
          <a className={styles.link} href={LINKS.sponsor} target="_blank" rel="noopener">
            Sponsor
          </a>
        </div>

        <div className={styles.fine}>
          <p>{COPY.footer.copyright[locale]}</p>
          <p>{COPY.footer.legal[locale]}</p>
          <p>{COPY.footer.credit[locale]}</p>
        </div>
      </div>
    </footer>
  )
}

/** Drawn in Mark.tsx's idiom: 1.9-stroke, round caps, no fill. */
function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 1.8v2.3M10 15.9v2.3M18.2 10h-2.3M4.1 10H1.8M15.9 4.1l-1.6 1.6M5.7 14.3l-1.6 1.6M15.9 15.9l-1.6-1.6M5.7 5.7 4.1 4.1" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.3 12.4A7.4 7.4 0 1 1 7.6 2.7a6 6 0 0 0 9.7 9.7Z" />
    </svg>
  )
}
