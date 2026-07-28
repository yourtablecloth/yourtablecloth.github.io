import { useRef } from 'react'

import { Link } from '@tanstack/react-router'

import { COPY, HOW_STEPS, type Locale } from '../../content/site'
import { DUR, EASE, MOTION, STAGGER, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import styles from './HowItWorks.module.css'

/**
 * Three moves, told twice: the numbers in the copy, and a schematic beside
 * them (above, on narrow screens) that actually performs isolate/use/discard
 * on a miniature host + sandbox. The two are driven by the same beats, not
 * independently timed — the diagram borrows its cue points directly from the
 * entrance timeline below rather than re-deriving them, so they can never
 * drift out of sync with each other.
 *
 * Note the wording of step three: what disappears is what changed *inside*
 * the sandbox. The stronger claim — that nothing on the host is touched at
 * all — only holds for the no-install launcher, which is why it lives in its
 * own note below rather than being smuggled into the general description.
 *
 * The diagram is not a loop and not an entrance — it is the scroll.
 *
 * Isolate, use, discard is a sequence in time, and the reader is already
 * moving through it: the three steps pass the sticky diagram one after the
 * other, so the scroll that reveals step two is the scroll that fills the
 * sandbox. Playing it once on entry meant the animation was over before the
 * reader had read step one, and the copy below it was then describing
 * something that had already finished happening. Scrubbed, the picture is
 * never out of step with the words beside it, in either direction.
 *
 * The step buttons stay: they move the reader to that beat's place in the
 * scroll rather than scrubbing the diagram behind the page's back, so the
 * keyboard route and the scroll route end up in exactly the same state.
 * Under reduced motion there is no timeline at all: the diagram renders in
 * its step-02 state and the same buttons snap it between states instantly.
 */

/**
 * Visual states the diagram moves between. The GSAP timeline tweens toward
 * these, the reduced-motion path snaps straight to them — one set of numbers,
 * so the two can never visually disagree about what "open" or "installed"
 * looks like.
 */
const SANDBOX_OPEN = { opacity: 1, scale: 1 }
const SANDBOX_CLOSED = { opacity: 0, scale: 0.82 }
const CHIP_VISIBLE = { opacity: 1, scale: 1 }
const CHIP_HIDDEN = { opacity: 0, scale: 0.6 }

/**
 * The diagram's clock, in beats — one per step, each given an equal share of
 * the scrub range. Padding the timeline out to a whole number of beats is
 * what makes that share equal: without it the last beat would only be as long
 * as its own tween and step three would land while the reader was still
 * halfway down step two.
 */
const BEATS = 3

export function HowItWorks({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null)

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const steps = element.querySelectorAll<HTMLElement>(`.${styles.step}`)
      const stepButtons = element.querySelectorAll<HTMLButtonElement>(`.${styles.stepButton}`)
      const rules = element.querySelectorAll<HTMLElement>(`.${styles.rule}`)
      const express = element.querySelector<HTMLElement>(`.${styles.express}`)
      const list = element.querySelector<HTMLElement>(`.${styles.steps}`)
      const sandboxGroup = element.querySelector<SVGGElement>(`.${styles.sandboxGroup}`)
      const chips = element.querySelectorAll<SVGRectElement>(`.${styles.chip}`)

      /*
       * One writer for "which beat is showing", because two readouts hang off
       * it: the accent on that step's own segment of the spine, and
       * `aria-current="step"`, which is the only way the sequence exists for
       * a reader who cannot see the diagram at all. Guarded on change — the
       * scrub calls this on every scroll frame and the DOM writes are not
       * free.
       */
      let current = -1
      const setCurrent = (index: number) => {
        if (index === current) return
        current = index
        steps.forEach((step, i) => {
          if (i === index) step.dataset.current = ''
          else delete step.dataset.current
        })
        stepButtons.forEach((button, i) => {
          if (i === index) button.setAttribute('aria-current', 'step')
          else button.removeAttribute('aria-current')
        })
      }

      mm.add(MOTION.ok, () => {
        // The copy's own entrance, once, on the way in. Separate from the
        // diagram below on purpose: text that re-faded every time the reader
        // scrolled back a line would be unreadable.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: element, start: 'top 72%', once: true },
        })


        if (express) {
          tl.fromTo(
            express,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: DUR.slow, ease: EASE.out },
            `+=${STAGGER.loose}`,
          )
        }

        if (!list || !sandboxGroup || chips.length === 0) return

        /*
         * The diagram, on the scroll's clock.
         *
         * Anchored to the step list, but the range comes from the viewport
         * offsets, not from the list's height. That distinction is the whole
         * lesson here. Taking the range from the list's own extent forced the
         * list to BE the length of the performance, so each step was inflated
         * to a share of a viewport and a three-item stepper became a column
         * of empty. Taking it from the section instead fixed the density but
         * put the last beat after the stepper had already scrolled away —
         * this section is mostly padding and an aside, and the list it is
         * about is 300px in the middle of it.
         *
         * The range is bounded at BOTH ends by what the reader can actually
         * see, which is what the old `top 90%` / `bottom 35%` got wrong in
         * both directions. Measured at 1440x900: the scrub opened at scrollY
         * 5819 but the copy's own entrance does not fire until 5981, so the
         * sandbox was 77% open while the word for that beat was still at
         * opacity 0 — the picture performing a step the page had not said
         * yet. At the other end the diagram unsticks when its column runs
         * out at ~6725 and the last beat was still playing as it left the
         * top of the frame.
         *
         * So: start after the entrance has committed, end before the pin
         * releases. `62%` puts the first beat just behind the copy instead of
         * ahead of it, and `45%` lands the discard beat while the diagram is
         * still whole on screen. Both are measured off the list, so the three
         * beats stay tied to the three things they annotate at any window
         * size. `scrub` carries a little inertia, so a flick reads as
         * something with weight rather than as a value being assigned.
         *
         * Beat n runs from n to n+1 on this timeline; the tweens sit inside
         * their own beat with a beat of air after the last of them, which the
         * pad at the end pays for.
         */
        const diagram = gsap.timeline({
          scrollTrigger: {
            trigger: list,
            start: 'top 62%',
            end: 'bottom 45%',
            scrub: 0.6,
            onUpdate: (self) =>
              setCurrent(Math.min(BEATS - 1, Math.floor(self.progress * BEATS))),
          },
        })
        diagram.fromTo(
          sandboxGroup,
          SANDBOX_CLOSED,
          { ...SANDBOX_OPEN, duration: 0.55, ease: EASE.out, transformOrigin: '50% 50%' },
          0.15,
        )
        diagram.fromTo(
          chips,
          CHIP_HIDDEN,
          {
            ...CHIP_VISIBLE,
            duration: 0.4,
            ease: EASE.out,
            stagger: 0.14,
            transformOrigin: '50% 50%',
          },
          1.1,
        )
        diagram.to(
          chips,
          {
            ...CHIP_HIDDEN,
            duration: 0.28,
            ease: EASE.in,
            stagger: 0.08,
            transformOrigin: '50% 50%',
          },
          2.1,
        )
        diagram.to(
          sandboxGroup,
          { ...SANDBOX_CLOSED, duration: 0.45, ease: EASE.in, transformOrigin: '50% 50%' },
          2.4,
        )
        // Pads the timeline out to a whole number of beats — see BEATS.
        diagram.set({}, {}, BEATS)

        /*
         * The buttons move the reader, not the playhead.
         *
         * Scrubbing the diagram from a click would put the picture somewhere
         * the scroll position disagrees with, and the next wheel notch would
         * snap it back. Scrolling to the middle of the beat's own share of
         * the range gets there by the same route the scroll does, so the
         * keyboard path and the pointer path cannot diverge.
         */
        const cleanups: Array<() => void> = []
        stepButtons.forEach((button, index) => {
          const jump = () => {
            const st = diagram.scrollTrigger
            if (!st) return
            window.scrollTo({ top: st.start + (st.end - st.start) * ((index + 0.5) / BEATS) })
          }
          button.addEventListener('click', jump)
          cleanups.push(() => button.removeEventListener('click', jump))
        })
        return () => cleanups.forEach((cleanup) => cleanup())
      })

      mm.add(MOTION.reduced, () => {
        gsap.set(rules, { scaleY: 1 })
        gsap.set(stepButtons, { opacity: 1, y: 0 })
        if (express) gsap.set(express, { opacity: 1, y: 0 })

        if (!sandboxGroup || chips.length === 0) return

        // No timeline to scrub, so the buttons are the whole instrument here:
        // each one snaps the diagram to its beat and stays selected.
        const paint = (index: number) => {
          gsap.set(sandboxGroup, index === 2 ? SANDBOX_CLOSED : SANDBOX_OPEN)
          gsap.set(chips, index === 1 ? CHIP_VISIBLE : CHIP_HIDDEN)
          setCurrent(index)
        }
        paint(1)

        const cleanups: Array<() => void> = []
        stepButtons.forEach((button, index) => {
          const pick = () => paint(index)
          button.addEventListener('click', pick)
          cleanups.push(() => button.removeEventListener('click', pick))
        })
        return () => cleanups.forEach((cleanup) => cleanup())
      })
    },
    [locale],
  )

  return (
    <Section id="how" eyebrow={COPY.how.eyebrow[locale]} title={COPY.how.title[locale]}>
      <div ref={root}>
        <div className={styles.layout}>
          <div className={styles.diagram} aria-hidden="true">
            <svg className={styles.art} viewBox="0 0 320 180" aria-hidden="true" focusable="false">
              <g className={styles.host}>
                <rect className={styles.hostScreen} x="20" y="34" width="96" height="68" rx="6" />
                <rect className={styles.hostFile} x="34" y="50" width="34" height="7" rx="2" />
                <rect className={styles.hostFile} x="34" y="64" width="46" height="7" rx="2" />
                <rect className={styles.hostFile} x="34" y="78" width="26" height="7" rx="2" />
                <rect className={styles.hostStand} x="56" y="102" width="24" height="9" />
                <rect className={styles.hostBase} x="42" y="111" width="52" height="5" rx="2.5" />
              </g>
              <g className={styles.sandboxGroup}>
                <rect className={styles.sandboxWindow} x="176" y="26" width="122" height="98" rx="8" />
                <circle className={styles.sandboxDot} cx="190" cy="40" r="3" />
                <circle className={styles.sandboxDot} cx="200" cy="40" r="3" />
                <circle className={styles.sandboxDot} cx="210" cy="40" r="3" />
                <rect className={styles.chip} x="188" y="66" width="27" height="27" rx="5" />
                <rect className={styles.chip} x="222" y="66" width="27" height="27" rx="5" />
                <rect className={styles.chip} x="256" y="66" width="27" height="27" rx="5" />
              </g>
            </svg>
            <div className={styles.diagramLabels}>
              <span className={styles.diagramLabel}>{COPY.how.diagram.host[locale]}</span>
              <span className={styles.diagramLabel}>{COPY.how.diagram.sandbox[locale]}</span>
            </div>
          </div>

          <ol className={styles.steps}>
            {HOW_STEPS.map((step) => (
              <li key={step.key} className={styles.step}>
                <span className={styles.rule} aria-hidden="true" />
                <button type="button" className={styles.stepButton}>
                  <span className={styles.index} aria-hidden="true">
                    {step.index}
                  </span>
                  <h3 className={styles.title}>{step.title[locale]}</h3>
                  <p className={styles.body}>{step.body[locale]}</p>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <aside className={styles.express}>
          <h3 className={styles.expressTitle}>{COPY.how.expressTitle[locale]}</h3>
          <div className={styles.expressCopy}>
            <p className={styles.expressBody}>{COPY.how.expressBody[locale]}</p>
            <p className={styles.mac}>
              <span className={styles.badge}>{COPY.how.expressBadge[locale]}</span>
              {COPY.how.expressMac[locale]}{' '}
              <Link className={styles.macLink} to="/docs/$slug" params={{ slug: 'install-macos' }}>
                {COPY.how.expressMacLink[locale]}
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </Section>
  )
}
