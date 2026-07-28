import { useRef, type ReactNode } from 'react'

import { MOTION, gsap, reveal, useGsap } from '../../lib/motion'
import styles from './Section.module.css'

/**
 * Shared section scaffolding: eyebrow, title, then content.
 *
 * Every section uses this, so the vertical rhythm and the left alignment line
 * are identical the whole way down. That consistency is what a jury reads as
 * intent — and it is one decision, not a per-section judgement call.
 *
 * `solid` decides whether the section occludes the cloth behind it. It is a
 * real editorial choice, not a style flag: the section that talks about what
 * was under the cloth stays transparent so the reader takes the numbers against
 * the actual uncovered tiles, and the sections after it close over the table
 * because by then the argument has moved on from the metaphor.
 */
export function Section({
  id,
  eyebrow,
  title,
  children,
  solid = true,
}: {
  id: string
  eyebrow: string
  title: string
  children: ReactNode
  solid?: boolean
}) {
  const root = useRef<HTMLElement>(null)

  useGsap(
    ({ mm }) => {
      mm.add(MOTION.ok, () => {
        const element = root.current
        if (!element) return
        const targets = element.querySelectorAll('[data-reveal]')
        if (targets.length) reveal(targets, { trigger: element })
      })
      mm.add(MOTION.reduced, () => {
        gsap.set(root.current?.querySelectorAll('[data-reveal]') ?? [], { opacity: 1, y: 0 })
      })
    },
    [title],
  )

  return (
    <section
      ref={root}
      id={id}
      className={styles.section}
      data-solid={solid || undefined}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow} data-reveal>
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className={styles.title} data-reveal>
            {title}
          </h2>
        </header>
        {children}
      </div>
    </section>
  )
}
