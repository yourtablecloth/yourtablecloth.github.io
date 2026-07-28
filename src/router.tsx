import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    /*
     * Every route change was a hard cut — old view gone, new view there,
     * no continuity — on a page whose whole argument is one continuous
     * surface under the content. `defaultViewTransition: true` wraps each
     * commit in `document.startViewTransition()` so the DOM swap itself
     * dissolves instead of snapping; the actual crossfade/offset is
     * defined in app.css against `::view-transition-old/new(root)`.
     * Browsers without the API (no `startViewTransition` on `document`)
     * just navigate as before — this option is a no-op there, not a
     * feature we have to branch on ourselves.
     */
    defaultViewTransition: true,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
