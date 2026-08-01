import { useEffect, useRef } from 'react'

import { Link } from '@tanstack/react-router'

import { COPY, ECOSYSTEM, LINKS, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, STAGGER, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import styles from './Ecosystem.module.css'

/**
 * The rest of the family, beside the Windows desktop app covered elsewhere on
 * this page: the no-install launcher, the PWA, and the macOS port. One card
 * each, one clause of body copy — the page still shows rather than tells.
 *
 * The catalog block underneath is a contribution route, not a fifth product,
 * so it is styled distinctly and links out only. Its contents are never
 * reproduced here (see the naming policy at the top of site.ts).
 *
 * The cards land together on one stagger rather than the page's usual
 * one-at-a-time reveal, because they are a set — four equally-weighted
 * options, not a sequence to read in order.
 */
export function Ecosystem({ locale }: { locale: Locale }) {
  const root = useRef<HTMLUListElement>(null)

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const cards = element.querySelectorAll(`.${styles.card}`)

      mm.add(MOTION.ok, () => {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: DUR.slow,
            ease: EASE.out,
            stagger: STAGGER.base,
            scrollTrigger: { trigger: element, start: 'top 80%', once: true },
            // The pointer-tilt effect also sets `transform` on this element;
            // without this, GSAP's own inline transform from the entrance
            // would permanently outrank that CSS rule via the cascade.
            clearProps: 'transform',
          },
        )
      })

      mm.add(MOTION.reduced, () => {
        gsap.set(cards, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
      })
    },
    [locale],
  )

  // Pointer-driven tilt + highlight. One delegated listener on the grid, not
  // four per-card ones — closest() finds the hovered card and only its
  // custom properties are written, so this never triggers a React render.
  // Gated the same way the entrance animation is gated, but in CSS-media
  // terms rather than gsap.matchMedia: this is a continuous pointer
  // affordance, not a scroll-triggered timeline.
  useEffect(() => {
    const grid = root.current
    if (!grid) return
    if (!window.matchMedia(`${MOTION.ok} and (hover: hover)`).matches) return

    let active: HTMLElement | null = null

    const settle = (card: HTMLElement) => {
      card.style.setProperty('--mx', '50%')
      card.style.setProperty('--my', '50%')
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
    }

    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>(`.${styles.card}`)
      if (card !== active) {
        if (active) settle(active)
        active = card
      }
      if (!card) return

      const rect = card.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      // +/-4deg max on each axis — a card catching the light, not a flip.
      card.style.setProperty('--mx', `${px * 100}%`)
      card.style.setProperty('--my', `${py * 100}%`)
      card.style.setProperty('--ry', `${(px - 0.5) * 8}deg`)
      card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`)
    }

    const onLeave = () => {
      if (active) settle(active)
      active = null
    }

    grid.addEventListener('pointermove', onMove)
    grid.addEventListener('pointerleave', onLeave)
    return () => {
      grid.removeEventListener('pointermove', onMove)
      grid.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <Section
      id="ecosystem"
      eyebrow={COPY.ecosystem.eyebrow[locale]}
      title={COPY.ecosystem.title[locale]}
    >
      <ul className={styles.grid} ref={root}>
        {ECOSYSTEM.map((entry) => (
          <li key={entry.key} className={styles.card}>
            <div className={styles.cardHead}>
              {entry.badge ? <span className={styles.badge}>{entry.badge[locale]}</span> : null}
              <p className={styles.kind}>{entry.kind[locale]}</p>
            </div>
            <h3 className={styles.name}>{entry.name[locale]}</h3>
            <p className={styles.body}>{entry.body[locale]}</p>
            <p className={styles.requires}>
              {COPY.ecosystem.requiresLabel[locale]}: {entry.requires[locale]}
            </p>
            {entry.external ? (
              <a className={styles.link} href={entry.href} target="_blank" rel="noopener">
                {COPY.ecosystem.openLabel[locale]}
              </a>
            ) : (
              <Link
                className={styles.link}
                to="/docs/$slug"
                params={{ slug: entry.href.replace('/docs/', '') }}
              >
                {COPY.ecosystem.guideLabel[locale]}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <aside className={styles.catalog} data-reveal>
        <h3 className={styles.catalogTitle}>{COPY.ecosystem.catalogTitle[locale]}</h3>
        <p className={styles.catalogBody}>{COPY.ecosystem.catalogBody[locale]}</p>
        <div className={styles.catalogLinks}>
          <a className={styles.catalogLink} href={LINKS.catalog} target="_blank" rel="noopener">
            {COPY.ecosystem.contributeLabel[locale]}
          </a>
          <a
            className={styles.catalogLink}
            href={LINKS.catalogBrowser}
            target="_blank"
            rel="noopener"
          >
            {COPY.docs.catalogLink[locale]}
          </a>
        </div>
      </aside>
    </Section>
  )
}
