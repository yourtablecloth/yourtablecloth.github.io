import { useRef } from 'react'

import { COPY, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import { community } from '../../data/community'
import styles from './Faq.module.css'

/**
 * Frequently asked questions, as native <details> disclosures.
 *
 * Native means keyboard-reachable and fully functional with no JS, so nothing
 * here reimplements a stateful accordion — the toggle listener only ever
 * supplements the browser's own open/close, never replaces it.
 *
 * `<details>` cannot transition height on its own, so the answer's height is
 * driven manually: expanding tweens it from 0 to its measured `scrollHeight`;
 * collapsing is the same tween run backwards, but since the native `toggle`
 * event fires *after* the browser has already hidden the content, closing has
 * to force `open` back on for the duration of the animation and only commit
 * the real close once it finishes. Under reduced motion none of this attaches
 * at all, so the browser's instant default is untouched.
 */
export function Faq({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const rows = element.querySelectorAll<HTMLDetailsElement>(`.${styles.row}`)

      mm.add(MOTION.ok, () => {
        const cleanups: Array<() => void> = []

        rows.forEach((details) => {
          const answer = details.querySelector<HTMLElement>(`.${styles.answer}`)
          if (!answer) return

          // Toggling `details.open` from inside this handler queues another
          // `toggle` event; this flag tells the handler to ignore the one it
          // caused itself instead of recursing into it.
          let internal = false
          let tween: gsap.core.Tween | null = null

          const onToggle = () => {
            if (internal) {
              internal = false
              return
            }
            tween?.kill()

            if (details.open) {
              details.dataset.expanded = 'true'
              tween = gsap.fromTo(
                answer,
                { height: 0 },
                {
                  height: answer.scrollHeight,
                  duration: DUR.base,
                  ease: EASE.soft,
                  onComplete: () => {
                    gsap.set(answer, { height: 'auto' })
                  },
                },
              )
            } else {
              // The browser already closed it and hid the answer. Force it
              // back open so there is something to animate, and only make
              // the close real once the collapse tween finishes.
              details.dataset.expanded = 'false'
              const from = answer.scrollHeight
              internal = true
              details.open = true
              tween = gsap.fromTo(
                answer,
                { height: from },
                {
                  height: 0,
                  duration: DUR.base,
                  ease: EASE.soft,
                  onComplete: () => {
                    internal = true
                    details.open = false
                  },
                },
              )
            }
          }

          details.addEventListener('toggle', onToggle)
          cleanups.push(() => {
            details.removeEventListener('toggle', onToggle)
            tween?.kill()
          })
        })

        return () => cleanups.forEach((cleanup) => cleanup())
      })

      // Reduced motion: the listener above is simply never attached, so
      // `<details>` keeps the browser's native, instant open/close.
      mm.add(MOTION.reduced, () => {})
    },
    [locale],
  )

  return (
    <Section id="faq" eyebrow={COPY.faq.eyebrow[locale]} title={COPY.faq.title[locale]}>
      <div className={styles.list} ref={root}>
        {community.faq.map((item) => (
          <details key={item.key} className={styles.row} data-reveal>
            <summary className={styles.question}>
              <span>{item.question[locale]}</span>
              <span className={styles.marker} aria-hidden="true" />
            </summary>
            <p className={styles.answer}>{item.answer[locale]}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
