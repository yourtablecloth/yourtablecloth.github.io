import { useCallback, useEffect, useState } from 'react'

import { COPY, type Locale } from '../../content/site'
import { detectInApp, escapeInApp, type InAppKind } from '../../lib/inapp'
import styles from './InAppNotice.module.css'

const SEEN_KEY = 'tc.inapp'

/**
 * The way out of somebody else's browser.
 *
 * A link shared in KakaoTalk opens in KakaoTalk, and the first real phone
 * report of this page came from exactly that: a recording where the scene
 * updated on 21% of frames over nine seconds — about 20fps against a 120Hz
 * panel — with a 1.35-second stall. The page is not going to win that fight
 * inside a WebView it does not control, and the reader has a perfectly good
 * browser one tap away that it would win easily.
 *
 * Three rules it follows:
 *
 *   It never redirects on its own. Throwing somebody into another app they
 *   did not ask for is worse than a slow page, and a reader who only wants to
 *   skim should be allowed to skim.
 *
 *   It only appears where it can help. `detectInApp` returns null for every
 *   real browser, so a desktop visitor — a juror, say — never sees it exist.
 *
 *   It asks once. Dismissing writes to localStorage, because a banner that
 *   returns on every navigation is the thing it was trying not to be.
 */
export function InAppNotice({ locale }: { locale: Locale }) {
  // Client-only: the user agent is not knowable at render time on the server,
  // and guessing it would desync the first paint.
  const [kind, setKind] = useState<InAppKind>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) === 'off') return
    } catch {
      // Private mode with storage disabled: showing the notice is still right.
    }
    setKind(detectInApp(navigator.userAgent))
  }, [])

  const dismiss = useCallback(() => {
    setKind(null)
    try {
      localStorage.setItem(SEEN_KEY, 'off')
    } catch {
      /* nothing to persist to; the notice is gone for this page view anyway */
    }
  }, [])

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true))
  }, [])

  if (!kind) return null

  const t = COPY.inApp

  return (
    <aside className={styles.root} role="note">
      <p className={styles.title}>{t.title[locale]}</p>
      <p className={styles.body}>
        {t.body[locale]} {kind === 'ios' ? t.manual[locale] : null}
      </p>
      <div className={styles.actions}>
        {kind === 'ios' ? (
          <button type="button" className={styles.cta} onClick={copy}>
            {(copied ? t.copied : t.copy)[locale]}
          </button>
        ) : (
          <button type="button" className={styles.cta} onClick={() => escapeInApp(kind)}>
            {t.open[locale]}
          </button>
        )}
        <button type="button" className={styles.dismiss} onClick={dismiss}>
          {t.dismiss[locale]}
        </button>
      </div>
    </aside>
  )
}
