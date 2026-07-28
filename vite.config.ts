import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'

/*
 * Pretendard ships a monolithic 1.96MB variable font (every glyph in one file).
 * The dynamic subset declares the identical family and weight range but splits
 * into unicode-range chunks, so a Korean page pulls only the ranges it renders
 * and an English page never downloads Hangul at all. We import the subset
 * directly in app.css, so no alias is needed here — this config stays minimal.
 */
const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    /*
     * The build output is the published site, served from a public bucket with
     * no server in front of it. A sourcemap there is the whole `src/` tree,
     * comments and all, sitting next to the bundle. Vite already defaults to
     * false; it is pinned here because the cost of a plugin flipping it is
     * publishing the repo twice.
     */
    sourcemap: false,
  },
  plugins: [
    /*
     * Static output, not a server.
     *
     * `prerender` walks the app at build time and writes a real HTML file per
     * route into the client output — `/docs/faq` becomes `docs/faq/index.html`,
     * which is exactly the path GitHub Pages resolves that URL to. Crawling
     * starts at `/` and follows every same-origin `<a href>`, so the doc pages
     * come from the index that already links them rather than from a second
     * list here that would drift from src/content/docs.
     *
     * `spa` renders the app one more time with the route content left out and
     * parks the result at `404.html`, which is the file GitHub Pages serves —
     * with a 404 status — for any URL it has no file for. That page then boots
     * the router at whatever URL the reader actually asked for and renders the
     * root route's `notFoundComponent`.
     *
     * It has to be a shell and not a prerendered page: a prerendered document
     * embeds the router state of the URL it was rendered at, so serving one
     * under a different URL fails hydration outright. The shell embeds none,
     * which is the whole reason Start builds one.
     *
     * `maskPath` is the URL the shell is rendered at, and it must not be a URL
     * we also want a real page for — pages are keyed by path, so `/` (the
     * default) would quietly replace the home page with the shell. `/404` is
     * a real route for that reason alone; see src/routes/404.tsx.
     *
     * A server build is still produced under dist/server: the prerenderer
     * runs the app to get the HTML. It is build scaffolding, not a deploy
     * artifact — only dist/client is published.
     *
     * No sitemap block, so Start's generator stays off. It writes one entry
     * per crawled path, and the crawler counts `/#how` and `/docs/` as pages
     * of their own; public/sitemap.xml lists the nine real URLs instead.
     */
    tanstackStart({
      pages: [{ path: '/' }],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        /*
         * The crawler treats every href it finds as a page, including the
         * in-page section anchors in the header nav and the trailing-slash
         * spelling of a path it already has. Each one re-renders a document
         * that then overwrites the file the canonical path just wrote.
         */
        filter: ({ path }) => !path.includes('#') && (path === '/' || !path.endsWith('/')),
      },
      spa: {
        enabled: true,
        maskPath: '/404',
        prerender: { outputPath: '/404' },
      },
    }),
    viteReact(),
  ],
})

export default config
