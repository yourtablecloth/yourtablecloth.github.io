import { useEffect } from 'react'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ClothStage } from '../components/cloth/ClothStage'
import { Cover } from '../components/home/Cover'
import { Disclaimer } from '../components/home/Disclaimer'
import { Ecosystem } from '../components/home/Ecosystem'
import { Faq } from '../components/home/Faq'
import { Hero } from '../components/home/Hero'
import { HowItWorks } from '../components/home/HowItWorks'
import { Project } from '../components/home/Project'
import { SiteFooter, SiteHeader } from '../components/shell/Chrome'
import { Support } from '../components/home/Support'
import { Tally } from '../components/home/Tally'
import { Underneath } from '../components/home/Underneath'
import { COPY } from '../content/site'
import { resolveLegacyHash } from '../lib/legacy-hash'
import { usePrefs } from '../lib/prefs'

export const Route = createFileRoute('/')({ component: Home })

/**
 * One cloth, taken off and put back.
 *
 * `ClothStage` is a fixed layer behind everything; the sections below scroll
 * over it, and scrolling is what peels the cloth off the table. So the document
 * order is also the state of the cloth:
 *
 *   Hero        covered — the table, and nothing to see
 *   Tally       peeling — the total, stated once, full-bleed
 *   Underneath  off — what was under it, measured
 *   HowItWorks  off — isolate, use, discard
 *   Ecosystem   off — the rest of the family: launcher, PWA, macOS port
 *   Project     off — install it, and the facts behind it
 *   Faq         off — questions the project's own docs already answer
 *   Support     off — who sponsors it, who covered it, where to go next
 *   Cover       coming back — the ending the hero never got to perform
 *   Disclaimer  the project's own liability notice, deliberately last and
 *               deliberately opaque — the one block that interrupts
 *
 * Every number comes from the committed snapshot in src/data/catalog.ts and
 * src/data/community.ts.
 */
function Home() {
  const { locale } = usePrefs()
  const navigate = useNavigate()

  /*
   * The previous site's pages were hashes on this one URL, so `/#faq` still
   * arrives here and would otherwise sit on the home page doing nothing. It
   * runs on the client because there is nothing else to run it on: the
   * document is prerendered, and a fragment is never sent to the server
   * anyway. `replace` keeps the dead URL out of the reader's back button.
   *
   * `hashchange` as well as mount: the effect body runs once per mount, and a
   * reader already sitting on this page who follows an old `/#install` link
   * from somewhere else only changes the fragment — no navigation, no remount,
   * and without this listener no redirect either. See lib/legacy-hash.ts for
   * which fragments are legacy and which are this page's own.
   */
  useEffect(() => {
    const go = () => {
      const target = resolveLegacyHash(window.location.hash)
      if (target) navigate({ to: target, replace: true })
    }

    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [navigate])

  return (
    <>
      <a className="app-skip-link" href="#main">
        {COPY.nav.skip[locale]}
      </a>
      <ClothStage locale={locale} />
      <SiteHeader locale={locale} />
      <main id="main" className="app-shell">
        <Hero locale={locale} />
        <Tally locale={locale} />
        <Underneath locale={locale} />
        <HowItWorks locale={locale} />
        <Ecosystem locale={locale} />
        <Project locale={locale} />
        <Faq locale={locale} />
        <Support locale={locale} />
        <Cover locale={locale} />
        <Disclaimer locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  )
}
