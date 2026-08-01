import type { CSSProperties } from 'react'

import { Link } from '@tanstack/react-router'

import { COPY, LINKS, type Locale } from '../../content/site'
import styles from './Hero.module.css'

/**
 * Hero.
 *
 * Copy only — the cloth behind it is a page-level layer (see ClothStage), not
 * something the hero owns. So this is a release-note pill, four lines of type,
 * and two buttons, all held low in the frame to leave the cloth room to be
 * looked at.
 *
 * The entrance is not a GSAP reveal like the other sections. It is keyed to the
 * cloth's fall through `html[data-cloth]`, reproducing the beat of the app's
 * own splash: the title starts fading in when the cloth is 40% of the way down
 * (SplashScreen.axaml, issue #296 — Cue 0.4 of a 1.2s CubicEaseOut), so the
 * words arrive with the fabric rather than before it.
 *
 * The hero's scroll track is well over two viewports long, and that length is
 * not padding — it is the run the cloth needs to come off the table. It used
 * to be silent: the headline sat pinned while the single best thing on the
 * page happened behind it, unremarked. Now the intro hands over to three
 * captions that are paced by the peel itself (`--tc-peel`, written by
 * ClothScene), so the words and the fabric are the same clock. Both blocks
 * occupy the same grid cell, which is what makes it a crossfade in place
 * rather than two things taking turns in two positions.
 *
 * `--tc-peel` used to be written on `<html>` on every scroll frame, which
 * meant the whole document — all 15,000px of it — recomputed style on that
 * frame too (measured at 2,061ms of 4,622ms total task time over 5s of
 * throttled scrolling). `data-tc-peel` marks this section as the smallest
 * subtree that actually reads the property, so ClothScene can host it here
 * instead: a marker only, no value, found by `querySelector('[data-tc-peel]')`,
 * never read by CSS itself.
 */
export function Hero({ locale }: { locale: Locale }) {
  return (
    <section className={styles.root} aria-labelledby="hero-title" data-tc-peel>
      <div className={styles.copy}>
        <div className={styles.stack}>
          <div className={styles.intro}>
            <Link
              className={styles.announce}
              to="/docs/$slug"
              params={{ slug: 'install-macos' }}
            >
              <span className={styles.badge}>{COPY.hero.badge[locale]}</span>
              <span className={styles.announceText}>{COPY.hero.badgeText[locale]}</span>
              <span className={styles.announceArrow} aria-hidden="true">
                →
              </span>
            </Link>

            <p className={styles.eyebrow}>{COPY.hero.eyebrow[locale]}</p>

            <h1 id="hero-title" className={styles.title}>
              {COPY.hero.title[locale].map((line) => (
                <span key={line} className={styles.line}>
                  {line}
                </span>
              ))}
            </h1>

            <p className={styles.lede}>{COPY.hero.lede[locale]}</p>

            {/*
              Three routes off the first screen, in the order a reader wants
              them: run it now, install it properly, read it first.

              The first is a direct asset link rather than a page, so `download`
              asks the browser to save it instead of navigating — GitHub already
              serves the asset as an attachment, so this only makes the intent
              explicit for the browsers that honour it. It is also the one link
              here that is not `target="_blank"`: opening a blank tab that
              immediately downloads and then sits there empty is a worse result
              than a download starting in the tab the reader is already in.
            */}
            <div className={styles.actions}>
              <a
                className={styles.primary}
                href={LINKS.noInstall}
                aria-label={COPY.hero.noInstallAria[locale]}
                download
              >
                {COPY.hero.noInstall[locale]}
              </a>
              <a
                className={styles.secondary}
                href={LINKS.releasesLatest}
                aria-label={COPY.hero.installAria[locale]}
                target="_blank"
                rel="noopener"
              >
                {COPY.hero.install[locale]}
              </a>
              <a className={styles.secondary} href={LINKS.github} target="_blank" rel="noopener">
                {COPY.hero.source[locale]}
              </a>
            </div>
          </div>

          {/*
            `from`/`to` ride in as custom properties rather than as a class per
            caption: the timing is data (site.ts), and pushing it through the
            style attribute keeps the stylesheet down to one rule that works
            for any number of captions.
          */}
          <ol className={styles.reveal}>
            {COPY.reveal.map((caption) => (
              <li
                key={caption.key}
                className={styles.caption}
                style={
                  { '--from': caption.from, '--to': caption.to } as CSSProperties
                }
              >
                {caption.text[locale]}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* The canvas is decorative to assistive tech; this is the content it
          stands for. */}
      <p className="app-visually-hidden">{COPY.hero.alt[locale]}</p>
    </section>
  )
}
