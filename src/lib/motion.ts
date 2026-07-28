import { useEffect } from 'react'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Motion layer.
 *
 * Rules, enforced here rather than per-component:
 *   - never `linear`; easing is power2.out / expo.out
 *   - 200-600ms duration, 40-80ms stagger
 *   - entrances decelerate fast, exits are short
 *   - every decorative motion must vanish under prefers-reduced-motion while
 *     the information it carried stays readable
 *
 * The reduced-motion contract is implemented with `gsap.matchMedia`, so the
 * animations are not merely sped up — they are never created, and elements are
 * left in their final state.
 */

export const EASE = {
  /** entrances: fast start, long settle */
  out: 'expo.out',
  /** small state changes */
  soft: 'power2.out',
  /** exits */
  in: 'power2.in',
} as const

export const DUR = { fast: 0.2, base: 0.4, slow: 0.6 } as const
export const STAGGER = { tight: 0.04, base: 0.06, loose: 0.08 } as const

let registered = false

export function useGsap(setup: (ctx: { mm: gsap.MatchMedia }) => void, deps: Array<unknown> = []) {
  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger)
      registered = true
    }

    // Tells CSS that JS is live, so `[data-reveal]` may start hidden. Without
    // this class the resting state is visible — content is never trapped
    // invisible if the bundle fails.
    document.documentElement.classList.add('motion-ready')

    const mm = gsap.matchMedia()
    setup({ mm })
    return () => mm.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Media queries for matchMedia blocks. `ok` = motion allowed. */
export const MOTION = {
  ok: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const

/**
 * The page's one reveal recipe: rise + fade, triggered once on scroll-in.
 * Every section uses it so the rhythm is identical throughout — consistency is
 * what a jury reads as intent.
 */
export function reveal(
  targets: gsap.TweenTarget,
  options: { stagger?: number; y?: number; delay?: number; trigger?: Element } = {},
) {
  const { stagger = STAGGER.base, y = 24, delay = 0, trigger } = options
  return gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: DUR.slow,
      ease: EASE.out,
      stagger,
      delay,
      scrollTrigger: trigger ? { trigger, start: 'top 80%', once: true } : undefined,
    },
  )
}

export { gsap, ScrollTrigger }
