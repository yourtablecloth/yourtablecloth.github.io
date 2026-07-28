import { HeadContent, Scripts, createRootRoute, useRouteContext } from '@tanstack/react-router'

import appCss from '../styles/app.css?url'
import { COPY } from '../content/site'
import { NotFound } from '../components/shell/NotFound'
import { InAppNotice } from '../components/shell/InAppNotice'
import { readLocale } from '../lib/locale'
import { SITE_ORIGIN } from '../lib/origin'
import { PrefsProvider, THEME_BOOTSTRAP } from '../lib/prefs'

export const Route = createRootRoute({
  // The default at prerender time, the reader's cookie on every client
  // navigation after that. See lib/locale.ts.
  beforeLoad: () => ({ locale: readLocale() }),
  head: ({ match }) => {
    const locale = match.context.locale
    /*
     * The card art is a real 1200x630 capture of the hero — the cloth on the
     * table with the programs standing on it — because that image IS the
     * argument, and a share preview is the only part of this page most people
     * will ever see. `twitter:card` was already claiming `summary_large_image`
     * with no image to show, which is worse than claiming nothing: X renders
     * no card at all rather than falling back to a small one.
     */
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: COPY.meta.title[locale] },
        { name: 'description', content: COPY.meta.description[locale] },
        { name: 'author', content: 'rkttu (남정현)' },
        { property: 'og:site_name', content: locale === 'ko' ? '식탁보®' : 'TableCloth®' },
        { property: 'og:title', content: COPY.meta.title[locale] },
        { property: 'og:description', content: COPY.meta.description[locale] },
        { property: 'og:locale', content: locale === 'ko' ? 'ko_KR' : 'en_US' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${SITE_ORIGIN}/` },
        { property: 'og:image', content: `${SITE_ORIGIN}/og.png` },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: COPY.hero.alt[locale] },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${SITE_ORIGIN}/og.png` },
        { name: 'twitter:image:alt', content: COPY.hero.alt[locale] },
        // Matches the dark-first table surface applied by THEME_BOOTSTRAP.
        { name: 'theme-color', content: '#141019' },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        /*
         * The same asset the wordmark uses. Without it the browser probes
         * /favicon.ico on every first visit and takes a 404 — which showed up
         * as the only failing request on the deployed build, and left the tab
         * with a blank page icon.
         */
        { rel: 'icon', type: 'image/svg+xml', href: '/tablecloth.svg' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: `${SITE_ORIGIN}/` },
      ],
    }
  },
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale } = useRouteContext({ from: Route.id })

  return (
    <html lang={locale}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <HeadContent />
      </head>
      <body>
        <PrefsProvider initialLocale={locale}>
          {children}
          {/* Site-wide, and self-hiding in every browser the reader chose. */}
          <InAppNotice locale={locale} />
        </PrefsProvider>
        <Scripts />
      </body>
    </html>
  )
}
