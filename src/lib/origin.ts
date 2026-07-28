/**
 * The origin this site is published under.
 *
 * Social metadata is the one place a relative URL is not good enough: og:image
 * and og:url are read by crawlers that never loaded the document, so they have
 * to be absolute or the card silently renders without art.
 *
 * This used to be read off the incoming request, which is only possible while
 * a server is rendering each response. The site is static now — every page is
 * prerendered at build time and served as files by GitHub Pages under the
 * CNAME below — so there is no request to read from, and the host is a
 * build-time fact rather than a runtime one.
 *
 * Origin only: no trailing slash, no path. Also feeds the generated sitemap's
 * host (vite.config.ts) and the canonical link in routes/__root.tsx, so those
 * three can never disagree.
 */
export const SITE_ORIGIN = 'https://yourtablecloth.app'
