import { useRef } from 'react'

import { COPY, LINKS, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, STAGGER, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import { community } from '../../data/community'
import { SPONSORS } from '../../data/sponsors'
import styles from './Support.module.css'

/**
 * Who keeps this running, who wrote about it, and where to go next.
 *
 * The public sponsors are named because GitHub already lists them publicly;
 * the anonymous ones are counted, never guessed at — that privacy is the whole
 * point of sponsoring anonymously. The list is regenerated on every deploy, so
 * it carries its own date; see src/data/sponsors.ts.
 *
 * Sponsors arrive as a roll call rather than a fade: each avatar pops in on a
 * tight stagger, in the same DOM order they render — so the anonymous badge,
 * last in that list, is also the last to land.
 */
export function Support({ locale }: { locale: Locale }) {
  const { coverage, asOf } = community
  const root = useRef<HTMLDivElement>(null)

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const avatars = element.querySelectorAll(`.${styles.avatars} > li`)

      mm.add(MOTION.ok, () => {
        gsap.fromTo(
          avatars,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: DUR.base,
            ease: EASE.out,
            stagger: STAGGER.tight,
            scrollTrigger: { trigger: element, start: 'top 80%', once: true },
          },
        )
      })

      mm.add(MOTION.reduced, () => {
        gsap.set(avatars, { opacity: 1, scale: 1 })
      })
    },
    [locale],
  )

  return (
    <Section id="support" eyebrow={COPY.support.eyebrow[locale]} title={COPY.support.title[locale]}>
      <div ref={root}>
        <div className={styles.block}>
          <p className={styles.blockLabel}>{COPY.support.sponsorsLabel[locale]}</p>
          <ul className={styles.avatars}>
            {SPONSORS.people.map((person) => (
              <li key={person.login}>
                <a
                  className={styles.avatarLink}
                  href={person.profileUrl}
                  target="_blank"
                  rel="noopener"
                  title={`${COPY.support.sinceLabel[locale]} ${person.since}`}
                >
                  <img
                    className={styles.avatar}
                    src={person.avatarUrl}
                    alt={person.login}
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                </a>
              </li>
            ))}
            {SPONSORS.anonymousCount > 0 && (
              <li>
                <span
                  className={styles.anonymous}
                  role="img"
                  aria-label={`+${SPONSORS.anonymousCount} ${COPY.support.anonymousLabel[locale]}`}
                >
                  +{SPONSORS.anonymousCount}
                </span>
              </li>
            )}
          </ul>
          <a className={styles.cta} data-reveal href={LINKS.sponsor} target="_blank" rel="noopener">
            {COPY.support.becomeSponsor[locale]}
          </a>
          {/*
            * The sponsor list is regenerated on every deploy while the rest of
            * this section is a hand-read snapshot, so it gets its own date —
            * but only once it has actually moved past the section's. Printing
            * the same date twice reads as a mistake, not as provenance.
            */}
          {SPONSORS.asOf !== asOf && (
            <p className={styles.asOf} data-reveal>
              {COPY.project.asOf[locale]} {SPONSORS.asOf}
            </p>
          )}
        </div>

        <div className={styles.block}>
          <p className={styles.blockLabel}>{COPY.support.coverageLabel[locale]}</p>
          <ul className={styles.coverageList}>
            {coverage.map((item) => (
              <li key={item.key} className={styles.coverageRow} data-reveal>
                <a className={styles.coverageLink} href={item.url} target="_blank" rel="noopener">
                  <span className={styles.outlet}>{item.outlet}</span>
                  <span className={styles.coverageTitle}>{item.title[locale]}</span>
                  <span className={styles.year}>{item.year}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.block}>
          <p className={styles.blockLabel}>{COPY.support.linksLabel[locale]}</p>
          <div className={styles.pills}>
            <a className={styles.pill} data-reveal href={LINKS.github} target="_blank" rel="noopener">
              GitHub
            </a>
            <a className={styles.pill} data-reveal href={LINKS.catalog} target="_blank" rel="noopener">
              {COPY.project.catalogLink[locale]}
            </a>
            <a className={styles.pill} data-reveal href={LINKS.discord} target="_blank" rel="noopener">
              Discord
            </a>
            <a className={styles.pill} data-reveal href={LINKS.releases} target="_blank" rel="noopener">
              {COPY.support.releasesLink[locale]}
            </a>
          </div>
        </div>

        <p className={styles.asOf} data-reveal>
          {COPY.project.asOf[locale]} {asOf}
        </p>
      </div>
    </Section>
  )
}
