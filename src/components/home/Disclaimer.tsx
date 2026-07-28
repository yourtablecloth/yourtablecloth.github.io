import { useRef } from 'react'

import { COPY, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, gsap, useGsap } from '../../lib/motion'
import styles from './Disclaimer.module.css'

/**
 * The project's liability notice.
 *
 * Given its own block rather than being folded into the footer fine print, on
 * purpose. Everything above this point argues that the sandbox is disposable
 * and the host stays clean; a reader who takes that as "so nothing can go
 * wrong" has drawn the wrong conclusion, and the project itself says so. It is
 * the one place on the page where the copy is not compressed for elegance.
 *
 * Rendered as an <aside> with a real heading so it is reachable in a landmark
 * list rather than being decorative text a screen reader skims past.
 *
 * Every other section on this page eases in gently; this one does not. The
 * accent rule wipes down fast and the text follows immediately behind it — a
 * short, hard arrival, because it is a warning rather than an argument.
 */
export function Disclaimer({ locale }: { locale: Locale }) {
  const root = useRef<HTMLElement>(null)

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const rule = element.querySelector<HTMLElement>(`.${styles.rule}`)
      const text = element.querySelectorAll(`.${styles.eyebrow}, .${styles.title}, .${styles.body}`)

      mm.add(MOTION.ok, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: element, start: 'top 85%', once: true },
        })
        if (rule) {
          tl.fromTo(rule, { scaleY: 0 }, { scaleY: 1, duration: DUR.fast, ease: EASE.out })
        }
        tl.fromTo(text, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: DUR.fast, ease: EASE.out })
      })

      mm.add(MOTION.reduced, () => {
        if (rule) gsap.set(rule, { scaleY: 1 })
        gsap.set(text, { opacity: 1, y: 0 })
      })
    },
    [locale],
  )

  return (
    <aside ref={root} className={styles.root} aria-labelledby="disclaimer-title">
      <div className={styles.inner}>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.eyebrow}>{COPY.disclaimer.eyebrow[locale]}</p>
        <h2 id="disclaimer-title" className={styles.title}>
          {COPY.disclaimer.title[locale]}
        </h2>
        <p className={styles.body}>{COPY.disclaimer.body[locale]}</p>
      </div>
    </aside>
  )
}
