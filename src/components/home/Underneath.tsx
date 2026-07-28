import { useRef } from 'react'

import { COPY, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, STAGGER, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import { catalog } from '../../data/catalog'
import styles from './Underneath.module.css'

/**
 * What the cloth covers.
 *
 * Two views of one measurement: the list says which classes of program appear
 * and how widely, the histogram says how many land on a single site at once.
 * Between them they carry the argument without a paragraph of prose — and
 * without naming an institution or a product, which is deliberate (see the
 * header of src/data/catalog.ts).
 *
 * The motion here is not the page's generic fade. Bars grow from their own
 * baseline and the counts tick up to meet them, because the thing being
 * animated IS a measurement — the movement should read as tallying, not as a
 * decorative entrance.
 */

export function Underneath({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)
  const { programTypes, burden, totals } = catalog
  const widest = programTypes[0]?.sites ?? 1
  const tallest = Math.max(...burden.map((bucket) => bucket.sites))

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const meters = element.querySelectorAll(`.${styles.fill}`)
      const bars = element.querySelectorAll(`.${styles.barFill}`)
      const counts = element.querySelectorAll<HTMLElement>('[data-count]')

      mm.add(MOTION.ok, () => {
        const trigger = { trigger: element, start: 'top 72%', once: true } as const

        gsap.fromTo(
          meters,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: EASE.out,
            stagger: STAGGER.base,
            scrollTrigger: trigger,
          },
        )

        gsap.fromTo(
          bars,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: DUR.slow,
            ease: EASE.out,
            stagger: STAGGER.tight,
            scrollTrigger: trigger,
          },
        )

        for (const node of counts) {
          const target = Number(node.dataset.count)
          // Zeroed at setup, not at trigger time: the SSR markup carries the
          // real figure, so leaving it alone means the reader sees the answer
          // first and the count then restarts from nothing.
          node.textContent = '0'
          // Tween a plain object and write the rounded value out: animating
          // textContent directly would thrash layout on every frame.
          const counter = { value: 0 }
          gsap.to(counter, {
            value: target,
            duration: 1.1,
            ease: EASE.out,
            scrollTrigger: trigger,
            onUpdate: () => {
              node.textContent = String(Math.round(counter.value))
            },
          })
        }
      })

      // Reduced motion: every measurement is simply already at its value.
      mm.add(MOTION.reduced, () => {
        gsap.set(meters, { scaleX: 1 })
        gsap.set(bars, { scaleY: 1 })
        for (const node of counts) node.textContent = node.dataset.count ?? ''
      })
    },
    [locale],
  )

  // The one section that does not close over the table. It is the section
  // about what was on the cloth, and by the time it arrives the cloth has
  // just been taken off — so the numbers are read against the bare tabletop
  // they are talking about, not against a scrim pretending it is a page.
  return (
    <Section
      id="under"
      eyebrow={COPY.under.eyebrow[locale]}
      title={COPY.under.title[locale]}
      solid={false}
    >
      <div ref={root}>
        <ul className={styles.list}>
          {programTypes.map((type) => (
            <li key={type.key} className={styles.row} data-reveal>
              <span className={styles.label}>{type.label[locale]}</span>
              <span className={styles.role}>{type.role[locale]}</span>
              <span className={styles.meter} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ inlineSize: `${(type.sites / widest) * 100}%` }}
                />
              </span>
              <span className={styles.count}>
                <span data-count={type.sites}>{type.sites}</span>
                <span className="app-visually-hidden"> {COPY.under.sitesLabel[locale]}</span>
              </span>
            </li>
          ))}
        </ul>

        <figure className={styles.burden} data-reveal>
          <figcaption className={styles.burdenTitle}>
            {COPY.under.burdenTitle[locale]}
          </figcaption>
          <ul className={styles.bars}>
            {burden.map((bucket) => (
              <li key={bucket.programs} className={styles.bar}>
                <span
                  className={styles.barFill}
                  style={{ blockSize: `${(bucket.sites / tallest) * 100}%` }}
                  aria-hidden="true"
                />
                <span className={styles.barCount}>{bucket.sites}</span>
                <span className={styles.barLabel}>{bucket.programs}</span>
              </li>
            ))}
          </ul>
          <p className={styles.axis}>
            {totals.sitesWithPrograms}
            {COPY.under.sitesUnit[locale]} · {COPY.under.note[locale]}
          </p>
        </figure>
      </div>
    </Section>
  )
}
