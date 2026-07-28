import { useCallback, useRef, useState } from 'react'

import { COPY, INSTALL_COMMAND, LINKS, PROJECT_FACTS, type Locale } from '../../content/site'
import { EASE, MOTION, STAGGER, gsap, useGsap } from '../../lib/motion'
import { Section } from '../shell/Section'
import { catalog } from '../../data/catalog'
import styles from './Project.module.css'

/**
 * The closing section: install it, and the facts that make it credible.
 *
 * The GitHub counts move, so the page prints the date it read them rather than
 * implying they are live. Everything else here is fixed by the project's own
 * README.
 *
 * The install line types in rather than fading, because it is the one thing on
 * the page meant to be copy-pasted into a terminal — the motion should read as
 * a command being entered, not a sentence appearing. The full command is
 * always the server-rendered text of the `<code>` element, so it is present
 * without JS and copy-to-clipboard never depends on the animation running; the
 * typing tween only clears and retypes it once the scroll trigger actually
 * fires.
 */

export function Project({ locale }: { locale: Locale }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const root = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLElement>(null)

  /*
   * A clipboard write is refused often enough on a phone — in-app webviews,
   * a browser served over plain http, Firefox without the async clipboard —
   * that the unhandled path was the common one there, and it left the single
   * copy-paste target on the page looking simply broken. On a refusal the
   * command is selected instead, so the reader's own long-press menu is one
   * gesture away, and the button says which of the two just happened.
   */
  const copyCommand = useCallback(async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      ok = true
    } catch {
      const code = codeRef.current
      if (code) getSelection()?.selectAllChildren(code)
    }
    setCopyState(ok ? 'copied' : 'failed')
    setTimeout(() => setCopyState('idle'), 2400)
  }, [])

  const figures = [
    { key: 'sites', label: COPY.project.sites[locale], value: catalog.totals.sites },
    { key: 'programs', label: COPY.project.programs[locale], value: catalog.totals.programs },
    { key: 'stars', label: COPY.project.stars[locale], value: catalog.repo.stars },
    { key: 'forks', label: COPY.project.forks[locale], value: catalog.repo.forks },
  ]

  useGsap(
    ({ mm }) => {
      const element = root.current
      if (!element) return
      const code = codeRef.current
      const counts = element.querySelectorAll<HTMLElement>('[data-count]')

      mm.add(MOTION.ok, () => {
        const trigger = { trigger: element, start: 'top 75%', once: true } as const

        if (code) {
          const typer = { chars: 0 }
          gsap.to(typer, {
            chars: INSTALL_COMMAND.length,
            duration: INSTALL_COMMAND.length * STAGGER.tight,
            ease: EASE.soft,
            scrollTrigger: trigger,
            onStart: () => {
              code.textContent = ''
            },
            onUpdate: () => {
              code.textContent = INSTALL_COMMAND.slice(0, Math.round(typer.chars))
            },
            onComplete: () => {
              code.dataset.typed = 'true'
            },
          })
        }

        for (const node of counts) {
          const target = Number(node.dataset.count)
          const counter = { value: 0 }
          gsap.to(counter, {
            value: target,
            duration: 1.1,
            ease: EASE.out,
            scrollTrigger: trigger,
            onUpdate: () => {
              node.textContent = Math.round(counter.value).toLocaleString(locale)
            },
          })
        }
      })

      mm.add(MOTION.reduced, () => {
        if (code) code.dataset.typed = 'true'
        for (const node of counts) {
          node.textContent = Number(node.dataset.count).toLocaleString(locale)
        }
      })
    },
    [locale],
  )

  return (
    <Section id="project" eyebrow={COPY.project.eyebrow[locale]} title={COPY.project.title[locale]}>
      <div ref={root}>
        <div className={styles.install} data-reveal>
          <p className={styles.installTitle}>{COPY.project.installTitle[locale]}</p>
          <div className={styles.command}>
            <code ref={codeRef} className={styles.code}>
              {INSTALL_COMMAND}
            </code>
            <button
              type="button"
              className={styles.copy}
              data-copied={copyState === 'copied' || undefined}
              data-failed={copyState === 'failed' || undefined}
              onClick={copyCommand}
            >
              <span
                className={styles.copyLabel}
                data-state="copy"
                aria-hidden={copyState !== 'idle'}
              >
                {COPY.project.copy[locale]}
              </span>
              <span
                className={styles.copyLabel}
                data-state="copied"
                aria-hidden={copyState !== 'copied'}
              >
                {COPY.project.copied[locale]}
              </span>
              <span
                className={styles.copyLabel}
                data-state="failed"
                aria-hidden={copyState !== 'failed'}
              >
                {COPY.project.copyManual[locale]}
              </span>
            </button>
          </div>
        </div>

        <ul className={styles.figures}>
          {figures.map((figure) => (
            <li key={figure.key} className={styles.figure} data-reveal>
              <span className={styles.value} data-count={figure.value}>
                {figure.value.toLocaleString(locale)}
              </span>
              <span className={styles.figureLabel}>{figure.label}</span>
            </li>
          ))}
        </ul>

        <p className={styles.asOf} data-reveal>
          {COPY.project.asOf[locale]} {catalog.asOf}
        </p>

        <dl className={styles.facts} data-reveal>
          {PROJECT_FACTS.map((fact) => (
            <div key={fact.key} className={styles.fact}>
              <dt className={styles.factLabel}>{fact.label[locale]}</dt>
              <dd className={styles.factValue}>{fact.value[locale]}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.links} data-reveal>
          <a className={styles.link} href={LINKS.github} target="_blank" rel="noopener">
            GitHub
          </a>
          <a className={styles.link} href={LINKS.catalog} target="_blank" rel="noopener">
            {COPY.project.catalogLink[locale]}
          </a>
          <a className={styles.link} href={LINKS.discord} target="_blank" rel="noopener">
            Discord
          </a>
          <a className={styles.link} href={LINKS.sponsor} target="_blank" rel="noopener">
            Sponsor
          </a>
        </div>
      </div>
    </Section>
  )
}
