import { useRef } from 'react'

import { COPY, type Locale } from '../../content/site'
import { EASE, MOTION, gsap, useGsap } from '../../lib/motion'
import { catalog } from '../../data/catalog'
import styles from './Tally.module.css'

/**
 * Slower than Underneath's 1.1s counters: this is the page's single biggest
 * gesture, and a full-viewport digit landing in under a second would read as
 * a flicker rather than a tally actually being taken.
 */
const COUNT_SECONDS = 1.8

/**
 * The one full-bleed beat.
 *
 * Every section on the page — including Underneath, right after this one —
 * is the same shell-constrained, left-aligned column at the same rhythm. This
 * is the deliberate break: one number, centred, alone, at a size nothing else
 * on the page attempts. It sits between Hero and Underneath because that is
 * exactly where the argument is: the cloth has just come off (Hero), the
 * total is stated here before Underneath spends a whole section breaking it
 * down by class.
 *
 * No `<Section>` — no eyebrow, no h2, no scrim. It reads the number straight
 * off the bare table the cloth was just pulled from, same as Underneath and
 * for the same reason: contrast comes from a soft text-shadow (see the
 * stylesheet), not a panel pretending to be a page. `catalog.totals.programs`
 * is a count only, never a name — see the header of src/data/catalog.ts.
 *
 * Pinned with plain CSS `position: sticky` on `.pin`, the same primitive
 * Hero already uses for its own copy pane, rather than a GSAP scroll pin:
 * sticky needs no pin-spacer and cannot fight a ScrollTrigger elsewhere on
 * the page.
 */
export function Tally({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)
  const target = catalog.totals.programs

  useGsap(
    ({ mm }) => {
      const element = root.current
      const node = element?.querySelector<HTMLElement>('[data-count]')
      if (!element || !node) return

      mm.add(MOTION.ok, () => {
        // Until the ScrollTrigger fires, the node still carries the figure SSR
        // rendered into it — so the reader watched the total sit there fully
        // formed and then snap back to zero the moment the count began. The
        // motion layer takes ownership of the digits here, at setup, not at
        // trigger time.
        node.textContent = '0'

        // Tween a plain object and write the rounded value out — animating
        // textContent directly would thrash layout on every frame (same
        // trick as Underneath's counters).
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: COUNT_SECONDS,
          ease: EASE.out,
          /*
           * `top 15%`, not `top top`. The hero's "lift the cloth" run lands
           * the reader exactly on this element's top edge, which is the same
           * pixel `top top` fires on — a scroll that STOPS on the trigger
           * rather than crossing it left the count sitting at 0 forever,
           * because `once` means there is no second chance. Firing 15% of a
           * viewport earlier is invisible during an ordinary scroll and puts
           * the tween safely mid-flight by the time the run arrives, so the
           * reader lands on a number that is still moving.
           */
          scrollTrigger: { trigger: element, start: 'top 15%', once: true },
          onUpdate: () => {
            node.textContent = String(Math.round(counter.value))
          },
          onComplete: () => {
            // The landing must read the real figure, never a rounded
            // near-miss left over from the last tweened frame.
            node.textContent = String(target)
          },
        })
      })

      // Reduced motion: the count is simply already at its value.
      mm.add(MOTION.reduced, () => {
        node.textContent = String(target)
      })
    },
    [locale],
  )

  // Where the hero's "lift the cloth" run ends — see ClothStage's reveal. The
  // gesture is only finished once the reader is looking at what the bare
  // table was hiding, and this is it.
  return (
    <div className={styles.root} ref={root} data-reveal-end>
      <figure className={styles.pin}>
        <p className={styles.kicker}>{COPY.tally.kicker[locale]}</p>
        <p
          className={styles.value}
          data-count={target}
          // Belt and suspenders: aria-hidden keeps the whole element out of
          // the accessibility tree so it is never read mid-count; aria-live
          // "off" is a second guard against an announcement if that ever
          // changes. The real number lives in the static span below instead.
          aria-hidden="true"
          aria-live="off"
        >
          {target}
        </p>
        <span className="app-visually-hidden">{target}</span>
        <figcaption className={styles.caption}>{COPY.tally.caption[locale]}</figcaption>
      </figure>
    </div>
  )
}
