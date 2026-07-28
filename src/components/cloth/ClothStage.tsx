import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { COPY, type Locale } from '../../content/site'
import { PEEL_DWELL, PEEL_VIEWPORTS } from '../../lib/cloth'
import { MOTION } from '../../lib/motion'
import { usePrefs } from '../../lib/prefs'
import { Mark } from '../shell/Mark'
import styles from './ClothStage.module.css'

/**
 * How long the hint takes to walk the reader through the whole peel.
 *
 * The peel is 2.8 viewports of scrolling and the entire point of it is to be
 * watched, so this is paced for watching rather than for arriving.
 *
 * 9, not 6. Three captions are keyed to this run, and at 6 seconds the peel
 * moved at 420px/s, which gave each sentence about two seconds on screen —
 * enough to notice a line arrived, not enough to read it. 9 puts the fabric
 * at 280px/s and each caption at roughly three seconds, which is the pace
 * the copy was written for. It stays interruptible on the first contrary
 * input, so the cost of it being long is paid only by readers who want it.
 */
const REVEAL_SECONDS = 9

/**
 * Owns the full-bleed cloth and the boot state that goes with it.
 *
 * The scene is the page's background layer, so it is mounted here at page level
 * rather than inside the hero. Boot phase is published as a `data-cloth`
 * attribute on <html> instead of threaded through props: the hero's title
 * timing depends on it, the hint depends on it, and an attribute keeps that
 * coordination in CSS where it belongs — the same trick as `.motion-ready`.
 *
 *   loading  the WebGL chunk is still in flight; nothing has fallen yet
 *   falling  the cloth is coming down (1.2s, matching the app's splash)
 *   settled  it has landed; the page is interactive
 */

const ClothScene = lazy(() => import('./ClothScene'))

/**
 * What happens when the scene never arrives.
 *
 * The page already has a good answer for "no JavaScript": `data-cloth` is
 * never written, and `html:not([data-cloth])` in Hero.module.css puts the copy
 * on screen at full opacity over the plain surface — a static poster that
 * still makes the whole argument. That answer was unreachable for the case
 * that actually happens, which is not a reader with JS off but a reader whose
 * request for the WebGL chunk fails: hotel wifi, a proxy that dislikes a
 * 185KB module, one bad second on a train. `lazy()` rethrows that rejection
 * through Suspense, and with nothing to catch it the failure escalated from
 * "no cloth" to "no page" — the entire route replaced by an error screen.
 *
 * So the boundary swallows exactly one thing and does exactly one thing with
 * it: render nothing where the scene would have been, and tell the stage, so
 * `data-cloth` can be taken back off the document and the page falls into the
 * state it was already designed to have. Taking it off matters as much as
 * catching the error — left at `loading` the stage would hold a progress bar
 * over a scene that is never coming and keep the hero copy hidden behind it,
 * which is a worse failure than the crash it replaced.
 *
 * A class is not a style choice here; React still has no hook that catches a
 * render error.
 */
class SceneBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export type ClothPhase = 'loading' | 'falling' | 'settled'

export function ClothStage({ locale }: { locale: Locale }) {
  const { theme } = usePrefs()
  const [mounted, setMounted] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [touch, setTouch] = useState(false)
  const [phase, setPhase] = useState<ClothPhase>('loading')
  /** The chunk never arrived. See SceneBoundary. */
  const [failed, setFailed] = useState(false)

  // Client-only facts. Reading them during render would desync SSR; reading
  // them before mounting the scene avoids a second mount.
  useEffect(() => {
    setReduced(window.matchMedia(MOTION.reduced).matches)
    // "들춰보세요"/"Lift the cloth" is a mouse verb — there is nothing to lift
    // with one finger. site.ts has always carried the touch phrasing; this is
    // what finally asks for it.
    setTouch(window.matchMedia('(pointer: coarse)').matches)
    setMounted(true)
  }, [])

  /*
   * The phase attribute, and its absence.
   *
   * Absence is a state the stylesheets already answer — it is the no-scene
   * poster — so a failed scene removes the attribute rather than parking it on
   * a value. See SceneBoundary.
   */
  useEffect(() => {
    const root = document.documentElement
    if (failed) delete root.dataset.cloth
    else root.dataset.cloth = phase
  }, [phase, failed])

  const onReady = useCallback(() => setPhase('falling'), [])
  const onSettled = useCallback(() => setPhase('settled'), [])
  const onFail = useCallback(() => setFailed(true), [])

  /** Frame id of a reveal in flight, so a second press restarts rather than races. */
  const revealFrame = useRef(0)
  useEffect(
    () => () => {
      cancelAnimationFrame(revealFrame.current)
      delete document.documentElement.dataset.clothRevealing
    },
    [],
  )

  /*
   * Scrolls the reader through the peel instead of jumping them past it.
   *
   * `scrollTo({ behavior: 'smooth' })` is the obvious answer and the wrong
   * one twice over: its duration is the browser's to choose and it is tuned
   * for getting somewhere, whereas this is the one scroll on the page whose
   * whole value is the journey. So the position is driven per frame, in
   * `behavior: 'instant'` writes, because the root stylesheet sets
   * `scroll-behavior: smooth` and every one of these calls would otherwise
   * start a competing animation.
   *
   * It yields the moment the reader disagrees. Comparing the real scroll
   * position against the last one written catches a wheel, a trackpad, a
   * touch drag and a keyboard page alike, without listening for any of them:
   * if the page is somewhere this function did not put it, the reader has
   * taken over and the reveal is no longer wanted.
   */
  const reveal = useCallback(() => {
    /*
     * The landing is the first thing the uncovered table has to say, not the
     * end of the peel.
     *
     * Stopping at `PEEL_DWELL + PEEL_VIEWPORTS` left the reader parked on a
     * bare table with the last caption fading and nothing yet arguing why any
     * of it mattered — the gesture completed and the page went quiet. Tally
     * marks itself so this can carry through to it; a page without that
     * marker (/docs) still just runs to the end of the peel.
     */
    const landing = document.querySelector<HTMLElement>('[data-reveal-end]')
    const target = landing
      ? landing.getBoundingClientRect().top + window.scrollY
      : (PEEL_DWELL + PEEL_VIEWPORTS) * window.innerHeight
    const from = window.scrollY
    const distance = target - from
    cancelAnimationFrame(revealFrame.current)
    if (distance <= 0) return

    // Paced, not timed: REVEAL_SECONDS is the budget for the peel itself, so
    // the run to Tally past it travels at the same speed rather than
    // compressing the fabric into a shorter share of a fixed duration.
    const seconds = REVEAL_SECONDS * (distance / ((PEEL_DWELL + PEEL_VIEWPORTS) * window.innerHeight))

    if (reduced) {
      window.scrollTo({ top: target, behavior: 'instant' })
      return
    }

    /*
     * Says out loud that it is driving.
     *
     * The first 0.7 of a viewport is the dwell, where the sheet deliberately
     * does not move — so pressing the pill and then watching two seconds of
     * scrolling with a perfectly still cloth reads as a dead control, not as
     * an intro. The attribute lets the pill wear the accent while it is in
     * charge; the fill it wears comes from `--tc-dwell`, which is the actual
     * distance to the cloth rather than a spinner pretending to be progress.
     */
    document.documentElement.dataset.clothRevealing = ''
    const done = () => delete document.documentElement.dataset.clothRevealing

    const startedAt = performance.now()
    let written = from
    const step = (now: number) => {
      // The reader disagreed — a wheel, a trackpad, a drag, a keyboard page.
      // Whatever it was, the page is somewhere this function did not put it.
      if (Math.abs(window.scrollY - written) > 2) return done()
      const t = Math.min(1, (now - startedAt) / (seconds * 1000))
      // Sine in-out: leaves and arrives without a lurch, near-linear between.
      written = from + distance * (-(Math.cos(Math.PI * t) - 1) / 2)
      window.scrollTo({ top: written, behavior: 'instant' })
      if (t < 1) revealFrame.current = requestAnimationFrame(step)
      else done()
    }
    revealFrame.current = requestAnimationFrame(step)
  }, [reduced])

  return (
    <>
      {/*
       * `--tc-drift` and `--tc-dwell` used to be written on `<html>` as
       * inherited custom properties, which meant every scroll frame forced a
       * style recalc across the whole 15,000px document for two numbers only
       * a handful of elements ever read (measured at 2,061ms of 4,622ms total
       * task time over 5s of throttled scrolling; suppressing the writes cut
       * that to 947ms — drift alone was -451ms, dwell -57ms). `data-tc-drift`
       * marks this stage as the smallest subtree that reads `--tc-drift`
       * (`.glow`, `.vignette` and its `::after` — see the stylesheet), so
       * ClothScene can host the value here instead: a marker only, no value,
       * found by `querySelector('[data-tc-drift]')`, never read by CSS itself.
       */}
      <div className={styles.stage} data-tc-drift>
        {mounted ? (
          <SceneBoundary onFail={onFail}>
            <Suspense fallback={null}>
              <ClothScene
                theme={theme}
                locale={locale}
                reduced={reduced}
                onReady={onReady}
                onSettled={onSettled}
              />
            </Suspense>
          </SceneBoundary>
        ) : null}

        {/* Grade over the render, never under the content — see the stylesheet. */}
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />

        {/*
          The frame the page holds while the WebGL chunk is in flight.

          The app's own splash is a mark over an indeterminate progress line
          under the cloth. This is that, in the place the cloth is about to
          land. The bar leaves by lifting the moment the sheet starts falling,
          same direction as the sheet; the mark instead travels to where the
          header's own Mark already sits (see .bootMark in the stylesheet) —
          this splash resolves into permanent chrome rather than disappearing.
          See the stylesheet for why it stops short of the hero copy.
        */}
        <div className={styles.boot} aria-hidden="true">
          <Mark size={44} className={styles.bootMark} />
          <span className={styles.bootBar} />
        </div>
      </div>

      {/*
        The hint is a real control, not a caption — and a sibling of the stage
        rather than a child of it.

        "Lift the cloth" is a mouse verb and "swipe it" is a finger one, and
        both are still true: the drag they describe is the primary way to play
        with the sheet. But the whole performance is bound to scroll, and a
        reader who does not think to drag has no way to ask for it, so pressing
        this walks them through the peel at reading speed. Same invitation,
        second route.

        It cannot live inside the stage. That layer is `z-index: 0` and
        pointer-transparent so the cloth can be grabbed through the whole
        document, and `.app-shell` sits above it — which means the hero's own
        copy pane covers this pill and swallows every click aimed at it, while
        the pill stays perfectly visible underneath. Hit-testing does not care
        that the thing on top is a transparent div. Out here it is a real
        control in the real stacking order.
      */}
      {/*
       * `--tc-dwell` gets the same treatment as `--tc-drift` above, hosted on
       * its one consumer, `.hint::before`, rather than on `<html>`.
       * `data-tc-dwell` is the marker ClothScene finds with
       * `querySelector('[data-tc-dwell]')`.
       */}
      <button type="button" className={styles.hint} data-tc-dwell onClick={reveal}>
        {(touch ? COPY.hero.hintTouch : COPY.hero.hint)[locale]}
      </button>
    </>
  )
}
