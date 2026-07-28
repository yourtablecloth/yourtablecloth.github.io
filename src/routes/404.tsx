import { createFileRoute } from '@tanstack/react-router'

import { NotFound } from '../components/shell/NotFound'

/**
 * The URL the 404 shell is rendered at.
 *
 * A static host answers an unknown URL with `404.html` and nothing else, so
 * that file has to be the app booting from scratch — a shell with no route
 * content and no router state baked in, which the build produces by rendering
 * one page in shell mode (see `spa` in vite.config.ts). Pages are keyed by
 * path there, so the shell needs a URL of its own or it displaces the real
 * page at that path; this route is that URL, and it exists so the shell render
 * lands on a matched route with a 200 rather than on the not-found path it is
 * being built to serve.
 *
 * It renders `NotFound` for the reader who navigates to `/404` directly. Every
 * other unknown path gets the same component from the root route's
 * `notFoundComponent`, which is what the shell resolves to once it hydrates.
 */
export const Route = createFileRoute('/404')({
  component: NotFound,
})
